import path from 'path';
import { executeBucketQuery, createPaginatedQuery, BucketQueryOptions } from './wiki-api/bucket';
import { Recipe, ParsedRecipe, createRecipeKeySet, filterDuplicateRecipes } from '@rs-planner/core';
import { 
  loadDatabaseDump, 
  saveDatabaseDump, 
  createDatabaseDump,
  FileOperationOptions 
} from './utils/data-operations';

const CHUNK_SIZE = 5000;
const OUTPUT_FILE = path.resolve(process.cwd(), '..', 'data', 'recipes.json');

interface FetchState {
  allParsedRecipes: ParsedRecipe[];
  existingRecipeKeys: Set<string>;
  currentOffset: number;
  initialRecipeCount: number;
}

/**
 * Create the base query configuration for fetching recipes
 * Note: No orderBy since there's no good way to order recipes consistently
 */
function createRecipesQuery(): Omit<BucketQueryOptions, 'limit' | 'offset'> {
  return {
    bucket: 'recipe',
    select: ['production_json']
    // No orderBy - recipes don't have a reliable ordering field
  };
}

/**
 * Load existing data and initialize fetch state
 */
async function initializeFetchState(): Promise<FetchState> {
  const existingDump = await loadDatabaseDump<ParsedRecipe>(OUTPUT_FILE);
  
  if (existingDump) {
    const allParsedRecipes = existingDump.items || [];
    
    console.log(`Loaded existing data: ${allParsedRecipes.length} recipes`);
    
    return {
      allParsedRecipes,
      existingRecipeKeys: createRecipeKeySet(allParsedRecipes),
      currentOffset: 0,
      initialRecipeCount: allParsedRecipes.length
    };
  } else {
    console.log('No existing data found, starting fresh');
    return {
      allParsedRecipes: [],
      existingRecipeKeys: new Set(),
      currentOffset: 0,
      initialRecipeCount: 0
    };
  }
}

/**
 * Fetch a single chunk of recipes
 */
async function fetchChunk(offset: number): Promise<Recipe[]> {
  console.log(`Fetching chunk at offset ${offset}...`);
  
  const queryOptions = createPaginatedQuery(createRecipesQuery(), CHUNK_SIZE, offset);
  const response = await executeBucketQuery<Recipe>(queryOptions);
  
  console.log(`Fetched ${response.bucket.length} recipes`);
  return response.bucket;
}

/**
 * Process new recipes and update the fetch state
 */
function processNewRecipes(
  chunk: Recipe[],
  state: FetchState
): { newRecipesCount: number; duplicatesCount: number; parseErrorsCount: number } {
  const newParsedRecipes = filterDuplicateRecipes(chunk, state.allParsedRecipes, state.existingRecipeKeys);
  
  const parseErrorsCount = chunk.length - newParsedRecipes.length - (chunk.length - newParsedRecipes.length);
  
  if (newParsedRecipes.length > 0) {
    // Add new recipes to our collection and update the key set
    state.allParsedRecipes.push(...newParsedRecipes);
    
    // Update the existing recipe keys set
    for (const recipe of newParsedRecipes) {
      state.existingRecipeKeys.add(recipe.recipe_key);
    }
  }
  
  return {
    newRecipesCount: newParsedRecipes.length,
    duplicatesCount: chunk.length - newParsedRecipes.length,
    parseErrorsCount: 0 // We'll count parse errors inside filterDuplicateRecipes
  };
}

/**
 * Save current progress
 */
async function saveProgress(state: FetchState): Promise<void> {
  // For recipes, we don't track lastDataOffset since there's no reliable ordering
  const dump = createDatabaseDump(state.allParsedRecipes, 0);
  const fileOptions: FileOperationOptions = { outputFile: OUTPUT_FILE };
  await saveDatabaseDump(dump, fileOptions);
}

/**
 * Main function to fetch all recipes
 * Note: This always does a full sync since recipes can't be incrementally updated
 */
async function fetchAllRecipes(forceRefresh = false): Promise<void> {
  const state = await initializeFetchState();
  
  if (forceRefresh) {
    console.log('🔄 Forcing complete refresh...');
    state.allParsedRecipes = [];
    state.existingRecipeKeys = new Set();
    state.currentOffset = 0;
    state.initialRecipeCount = 0;
  } else if (state.allParsedRecipes.length > 0) {
    console.log('⚠️  Note: Recipe fetching always performs a full sync due to lack of reliable ordering.');
    console.log('Existing data will be merged with new data to avoid duplicates.');
  }

  console.log(`Starting to fetch recipes from offset ${state.currentOffset}...`);
  let consecutiveEmptyChunks = 0;
  const maxEmptyChunks = 3; // Stop after 3 consecutive empty chunks

  while (consecutiveEmptyChunks < maxEmptyChunks) {
    try {
      const chunk = await fetchChunk(state.currentOffset);
      
      if (chunk.length === 0) {
        consecutiveEmptyChunks++;
        console.log(`Empty chunk ${consecutiveEmptyChunks}/${maxEmptyChunks} at offset ${state.currentOffset}`);
      } else {
        consecutiveEmptyChunks = 0;
        
        // Process the new recipes
        const { newRecipesCount, duplicatesCount } = processNewRecipes(chunk, state);
        
        if (newRecipesCount > 0) {
          console.log(`Added ${newRecipesCount} new recipes (${duplicatesCount} duplicates filtered)`);
        } else {
          console.log(`No new recipes in this chunk (${duplicatesCount} duplicates filtered)`);
        }
      }

      state.currentOffset += CHUNK_SIZE;
      
      // Save progress every 10 chunks or when we get an empty chunk
      if (state.currentOffset % (CHUNK_SIZE * 10) === 0 || chunk.length === 0) {
        await saveProgress(state);
      }

      // Add a small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Failed to fetch chunk at offset ${state.currentOffset}:`, error);
      console.log('Saving current progress before retrying...');
      await saveProgress(state);
      
      // Wait a bit longer before retrying
      console.log('Waiting 5 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Save final result
  await saveProgress(state);
  
  const newRecipesAdded = state.allParsedRecipes.length - state.initialRecipeCount;
  
  console.log(`\n✅ Recipe database dump complete!`);
  console.log(`Total recipes in database: ${state.allParsedRecipes.length}`);
  if (newRecipesAdded > 0) {
    console.log(`New recipes added this run: ${newRecipesAdded}`);
  } else {
    console.log(`No new recipes were added this run.`);
  }
  console.log(`Output file: ${OUTPUT_FILE}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const forceRefresh = process.argv.includes('--force-refresh');
  
  if (forceRefresh) {
    console.log('🔄 Force refresh mode enabled - will start from beginning');
  } else {
    console.log('📋 Recipe fetching always performs full sync (no incremental updates available)');
  }
  
  try {
    await fetchAllRecipes(forceRefresh);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error);

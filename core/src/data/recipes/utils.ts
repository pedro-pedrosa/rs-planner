import { ParsedRecipe, Recipe, RecipeProductionJson } from "./types";

/**
 * Parse the production_json field from a recipe
 */
export function parseProductionJson(recipe: Recipe): RecipeProductionJson | null {
  try {
    return JSON.parse(recipe.production_json);
  } catch (error) {
    console.warn(`Failed to parse production_json for recipe:`, error);
    return null;
  }
}

/**
 * Generate a unique key for a recipe based on its content
 * Since there's no unique ID, we'll use a combination of output name, materials, and method
 */
export function generateRecipeKey(productionData: RecipeProductionJson): string {
  const outputName = productionData.output?.name || 'unknown';
  const materialNames = productionData.materials?.map(m => m.name).sort().join(',') || '';
  const facility = productionData.facility || '';
  const process = productionData.process || '';
  const method = productionData.method || '';
  
  return `${outputName}|${materialNames}|${facility}|${process}|${method}`;
}

/**
 * Convert a Recipe to ParsedRecipe with parsed production_json
 */
export function parseRecipe(recipe: Recipe): ParsedRecipe | null {
  const productionData = parseProductionJson(recipe);
  if (!productionData) {
    return null;
  }

  return {
    production_data: productionData,
    recipe_key: generateRecipeKey(productionData)
  };
}

/**
 * Create a Set of recipe keys for fast duplicate detection
 */
export function createRecipeKeySet(parsedRecipes: ParsedRecipe[]): Set<string> {
  return new Set(parsedRecipes.map(recipe => recipe.recipe_key));
}

/**
 * Filter duplicate recipes based on generated recipe keys
 */
export function filterDuplicateRecipes(
  newRecipes: Recipe[],
  existingParsedRecipes: ParsedRecipe[],
  existingRecipeKeys?: Set<string>
): ParsedRecipe[] {
  // Create the set if not provided
  const recipeKeySet = existingRecipeKeys || createRecipeKeySet(existingParsedRecipes);
  
  const uniqueParsedRecipes: ParsedRecipe[] = [];
  
  for (const recipe of newRecipes) {
    const parsedRecipe = parseRecipe(recipe);
    if (parsedRecipe && !recipeKeySet.has(parsedRecipe.recipe_key)) {
      uniqueParsedRecipes.push(parsedRecipe);
      recipeKeySet.add(parsedRecipe.recipe_key); // Add to set to prevent duplicates within this batch
    }
  }
  
  return uniqueParsedRecipes;
}

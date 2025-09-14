/**
 * Recipe-related types and utilities for RuneScape data structures
 */

export interface RecipeMaterial {
  quantity: string;
  name: string;
  image: string;
}

export interface RecipeOutput {
  quantity: string;
  name: string;
  image: string;
}

export interface RecipeSkill {
  experience: string;
  level: string;
  name: string;
}

export interface RecipeProductionJson {
  skill?: boolean;
  facility?: string;
  tool?: string;
  process?: string;
  quest?: string;
  outputs: RecipeOutput[];
  discovery: unknown[];
  ticks: string;
  members: string;
  output: {
    name_raw: string;
    quantity: string;
    name: string;
    image_raw: string;
    image: string;
    // Ignoring price/cost fields as requested
  };
  materials: RecipeMaterial[];
  skills: RecipeSkill[];
  method?: string;
  improved?: number;
}

export interface Recipe {
  production_json: string; // JSON string containing ProductionJson
}

export interface ParsedRecipe {
  production_data: RecipeProductionJson;
  recipe_key: string; // A unique identifier we'll generate
}

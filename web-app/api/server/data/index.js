/**
 * Data module — all JSON data imported at build time
 * Vite inlines JSON into the bundle, no file system reads needed
 */
import solarTermsData from '../../../data/solar_terms.json';
import citiesData from '../../../data/cities.json';
import constitutionsData from '../../../data/constitutions-v2.json';
import teaData from '../../../data/herbal_tea_pool_v2.json';
import recipeData from '../../../data/recipe_pool_v2.json';
import questionnaireData from '../../../data/constitution_questionnaire.json';
export const solarTerms = solarTermsData.solar_terms || [];
export const cities = citiesData.cities || [];
export const constitutions = constitutionsData.entries || [];
export const teaPools = teaData.entries || [];
export const recipePools = recipeData.entries || [];
export const questionnaire = questionnaireData;

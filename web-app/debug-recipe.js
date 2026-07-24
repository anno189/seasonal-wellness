import RecipeService from './src/server/services/RecipeService.js'

// Test extractIngredients
console.log('=== extractIngredients ===')
console.log('番茄鸡蛋面 →', [...RecipeService.getMainIngredient('番茄鸡蛋面')])
console.log('番茄炒蛋   →', [...RecipeService.getMainIngredient('番茄炒蛋')])
console.log('蒜蓉西兰花 →', [...RecipeService.getMainIngredient('蒜蓉西兰花')])
console.log('酸梅汤     →', [...RecipeService.getMainIngredient('酸梅汤')])

// Test overlap detection
const ing1 = RecipeService.getMainIngredient('番茄鸡蛋面')
const ing2 = RecipeService.getMainIngredient('番茄炒蛋')

console.log('\n=== Overlap test ===')
console.log('番茄鸡蛋面 ingredients:', [...ing1])
console.log('番茄炒蛋 ingredients:', [...ing2])

let hasOverlap = false
for (const item of ing1) {
  if (ing2.has(item)) {
    hasOverlap = true
    console.log('Overlap found:', item)
  }
}
console.log('Has overlap:', hasOverlap)

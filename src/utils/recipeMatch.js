export function getDaysLeft(
  expiryDate
) {

  const today =
    new Date()


  today.setHours(
    0,
    0,
    0,
    0
  )


  const expiry =
    new Date(
      expiryDate
    )


  expiry.setHours(
    0,
    0,
    0,
    0
  )


  return Math.ceil(
    (expiry - today) /
      (1000 * 60 * 60 * 24)
  )
}


/* =========================
   Normalize Ingredient ID
========================= */

function normalizeIngredientId(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return ''
  }


  const text =
    String(
      value
    ).trim()


  if (
    /^\d+$/.test(
      text
    )
  ) {

    return text.padStart(
      3,
      '0'
    )
  }


  return text
}


/* =========================
   Recipe Match
========================= */

export function getRecipeMatch(
  recipe,
  fridgeItems
) {

  let missing = 0
  let expiring = 0


  recipe.ingredients.forEach(
    (ingredient) => {

      const recipeIngredientId =
        normalizeIngredientId(
          ingredient.ingredient_id ??
          ingredient.ingredientId
        )


      const availableItems =
        fridgeItems.filter(
          (item) => {

            const fridgeIngredientId =
              normalizeIngredientId(
                item.ingredientId ??
                item.ingredient_id
              )


            const sameId =
              Boolean(
                recipeIngredientId &&
                fridgeIngredientId
              ) &&
              recipeIngredientId ===
                fridgeIngredientId


            const sameName =
              !fridgeIngredientId &&
              String(
                item.name || ''
              ).trim() ===
                String(
                  ingredient.name || ''
                ).trim()


            return (
              (
                sameId ||
                sameName
              ) &&
              getDaysLeft(
                item.expiryDate
              ) >= 0
            )
          }
        )


      /* =====================
         Missing
      ===================== */

      if (
        availableItems.length ===
        0
      ) {

        missing += 1

        return
      }


      /* =====================
         Quantity
      ===================== */

      const hasUnknownQuantity =
        availableItems.some(
          (item) =>
            item.quantity ===
              null ||
            item.quantity ===
              undefined ||
            item.quantity ===
              ''
        )


      if (
        !hasUnknownQuantity
      ) {

        const availableQuantity =
          availableItems.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.quantity
              ),
            0
          )


        const requiredQuantity =
          Number(
            ingredient.quantity
          )


        if (
          Number.isFinite(
            requiredQuantity
          ) &&
          availableQuantity <
            requiredQuantity
        ) {

          missing += 1
        }
      }


      /* =====================
         Expiring
      ===================== */

      const hasExpiringItem =
        availableItems.some(
          (item) => {

            const daysLeft =
              getDaysLeft(
                item.expiryDate
              )


            return (
              daysLeft >= 0 &&
              daysLeft <= 4
            )
          }
        )


      if (
        hasExpiringItem
      ) {

        expiring += 1
      }

    }
  )


  return {
    missing,
    expiring,
  }
}


/* =========================
   Rank Recipes
========================= */

export function rankRecipes(
  recipes,
  fridgeItems
) {

  return recipes

    .map(
      (recipe) => {

        const match =
          getRecipeMatch(
            recipe,
            fridgeItems
          )


        return {
          ...recipe,

          missing:
            match.missing,

          expiring:
            match.expiring,
        }
      }
    )


    .sort(
      (
        a,
        b
      ) => {


        /* =====================
           1. 临期越多越优先
        ===================== */

        if (
          a.expiring !==
          b.expiring
        ) {

          return (
            b.expiring -
            a.expiring
          )
        }


        /* =====================
           2. 缺少越少越优先
        ===================== */

        if (
          a.missing !==
          b.missing
        ) {

          return (
            a.missing -
            b.missing
          )
        }


        /* =====================
           3. 时间越短越优先
        ===================== */

        const timeA =
          Number.parseInt(
            a.cooking_time ??
            a.cookingTime,
            10
          ) || 0


        const timeB =
          Number.parseInt(
            b.cooking_time ??
            b.cookingTime,
            10
          ) || 0


        return (
          timeA -
          timeB
        )
      }
    )
}
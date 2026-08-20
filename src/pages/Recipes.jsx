import {
  useMemo,
  useState,
} from 'react'

import recipes from '../data/recipes'
import ingredients from '../data/ingredients'

import './Recipes.css'


const filters = [
  '全部',
  '肉菜',
  '素菜',
  '海鲜',
  '凉菜',
  '清淡',
  '香辣',
]


/* =====================================================
   Helpers
===================================================== */

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


function getRecipeId(
  recipe
) {

  return (
    recipe.recipe_id ||
    recipe.id ||
    ''
  )
}


function getRecipeTime(
  recipe
) {

  const value =
    recipe.cooking_time ??
    recipe.cookingTime ??
    recipe.time ??
    0


  const parsed =
    parseInt(
      value,
      10
    )


  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0
}


/* =====================================================
   Date
===================================================== */

function getDaysLeft(
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
    (
      expiry -
      today
    ) /
    (
      1000 *
      60 *
      60 *
      24
    )
  )
}


/* =====================================================
   Ingredient Master Lookup
===================================================== */

function findIngredientInfo(
  recipeIngredient
) {

  const recipeIngredientId =
    normalizeIngredientId(
      recipeIngredient.ingredient_id ??
      recipeIngredient.ingredientId
    )


  const recipeIngredientName =
    String(
      recipeIngredient.name ||
      ''
    ).trim()


  return (
    ingredients.find(
      (
        ingredient
      ) => {

        const masterId =
          normalizeIngredientId(
            ingredient.ingredient_id
          )


        const sameId =
          Boolean(
            recipeIngredientId &&
            masterId
          ) &&
          recipeIngredientId ===
            masterId


        const sameName =
          Boolean(
            recipeIngredientName
          ) &&
          ingredient.name ===
            recipeIngredientName


        return (
          sameId ||
          sameName
        )
      }
    ) ||
    null
  )
}


/* =====================================================
   Flavour / Style Tags

   肉菜 / 素菜 / 海鲜
   不在这里手写，
   会根据 ingredients.js 自动判断。

   这里只管理：
   凉菜 / 清淡 / 香辣
===================================================== */

const styleTags = {

  /* 清淡 */

  R002: [
    '清淡',
  ],

  R004: [
    '清淡',
  ],

  R005: [
    '清淡',
  ],

  R010: [
    '清淡',
  ],

  R013: [
    '清淡',
  ],

  R016: [
    '清淡',
  ],

  R017: [
    '清淡',
  ],

  R021: [
    '凉菜',
    '清淡',
  ],

  R022: [
    '凉菜',
    '清淡',
  ],

  R025: [
    '清淡',
  ],

  R027: [
    '清淡',
  ],

  R028: [
    '清淡',
  ],

  R029: [
    '清淡',
  ],

  R030: [
    '清淡',
  ],

  R034: [
    '清淡',
  ],

  R037: [
    '凉菜',
    '清淡',
  ],

  R039: [
    '清淡',
  ],

  R045: [
    '清淡',
  ],

  R047: [
    '清淡',
  ],

  R048: [
    '清淡',
  ],


  /* 香辣 */

  R012: [
    '香辣',
  ],

  R019: [
    '香辣',
  ],

  R020: [
    '香辣',
  ],

  R024: [
    '香辣',
  ],

  R032: [
    '香辣',
  ],

  R033: [
    '香辣',
  ],

  R040: [
    '香辣',
  ],

  R043: [
    '香辣',
  ],

  R044: [
    '香辣',
  ],

}


/* =====================================================
   Automatic Recipe Tags

   Priority:
   Seafood > Meat > Vegetarian
===================================================== */

function getRecipeTags(
  recipe
) {

  const recipeIngredients =
    recipe.ingredients ||
    []


  const ingredientCategories =
    recipeIngredients
      .map(
        (
          recipeIngredient
        ) => {

          const info =
            findIngredientInfo(
              recipeIngredient
            )


          return (
            info?.category ||
            ''
          )
        }
      )
      .filter(
        Boolean
      )


  const hasSeafood =
    ingredientCategories.includes(
      '海鲜'
    )


  const hasMeat =
    ingredientCategories.includes(
      '肉类'
    )


  let mainTag =
    '素菜'


  if (
    hasSeafood
  ) {

    mainTag =
      '海鲜'

  } else if (
    hasMeat
  ) {

    mainTag =
      '肉菜'
  }


  const recipeId =
    getRecipeId(
      recipe
    )


  const extraTags =
    styleTags[
      recipeId
    ] ||
    []


  return [
    ...new Set([
      mainTag,
      ...extraTags,
    ]),
  ]
}


/* =====================================================
   Recipe / Fridge Ingredient Match
===================================================== */

function isSameIngredient(
  recipeIngredient,
  fridgeItem
) {

  const recipeIngredientId =
    normalizeIngredientId(
      recipeIngredient.ingredient_id ??
      recipeIngredient.ingredientId
    )


  const fridgeIngredientId =
    normalizeIngredientId(
      fridgeItem.ingredientId ??
      fridgeItem.ingredient_id
    )


  const sameId =
    Boolean(
      recipeIngredientId &&
      fridgeIngredientId
    ) &&
    recipeIngredientId ===
      fridgeIngredientId


  /*
    Name fallback only for old
    localStorage items without ID.
  */

  const sameName =
    !fridgeIngredientId &&
    fridgeItem.name ===
      recipeIngredient.name


  return (
    sameId ||
    sameName
  )
}


/* =====================================================
   Recipe Match
===================================================== */

function getRecipeMatch(
  recipe,
  fridgeItems
) {

  let missing =
    0

  let expiring =
    0


  const recipeIngredients =
    recipe.ingredients ||
    []


  recipeIngredients.forEach(
    (
      ingredient
    ) => {

      const availableItems =
        fridgeItems.filter(
          (
            item
          ) => {

            return (
              isSameIngredient(
                ingredient,
                item
              ) &&
              getDaysLeft(
                item.expiryDate
              ) >= 0
            )
          }
        )


      /* =====================
         No Stock
      ===================== */

      if (
        availableItems.length ===
        0
      ) {

        missing +=
          1

        return
      }


      /* =====================
         Expiring
         0–4 days
      ===================== */

      const hasExpiringItem =
        availableItems.some(
          (
            item
          ) => {

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

        expiring +=
          1
      }


      /* =====================
         Unknown Quantity

         Quantity blank means:
         ingredient exists.

         Do not mark missing.
      ===================== */

      const hasUnknownQuantity =
        availableItems.some(
          (
            item
          ) => {

            return (
              item.quantity ===
                null ||
              item.quantity ===
                undefined ||
              item.quantity ===
                '' ||
              !Number.isFinite(
                Number(
                  item.quantity
                )
              )
            )
          }
        )


      if (
        hasUnknownQuantity
      ) {

        return
      }


      /* =====================
         Known Quantity
      ===================== */

      const availableQuantity =
        availableItems.reduce(
          (
            total,
            item
          ) => {

            return (
              total +
              Number(
                item.quantity
              )
            )
          },
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

        missing +=
          1
      }

    }
  )


  return {
    missing,
    expiring,
  }
}


/* =====================================================
   Recipes
===================================================== */

function Recipes({
  fridgeItems = [],
  onOpenRecipe,
}) {

  const [
    recipeList,
    setRecipeList,
  ] =
    useState(
      recipes
    )


  const [
    search,
    setSearch,
  ] =
    useState(
      ''
    )


  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      '推荐'
    )


  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState(
      '全部'
    )


  /* =====================================================
     Add Display Data
  ===================================================== */

  const recipesWithDisplayData =
    useMemo(
      () => {

        return recipeList.map(
          (
            recipe
          ) => {

            const match =
              getRecipeMatch(
                recipe,
                fridgeItems
              )


            return {

              ...recipe,

              tags:
                getRecipeTags(
                  recipe
                ),

              missing:
                match.missing,

              expiring:
                match.expiring,

              cookingTime:
                getRecipeTime(
                  recipe
                ),

            }
          }
        )

      },
      [
        recipeList,
        fridgeItems,
      ]
    )


  /* =====================================================
     Search / Filter / Sort
  ===================================================== */

  const filteredRecipes =
    useMemo(
      () => {

        const keyword =
          search
            .trim()
            .toLowerCase()


        const result =
          recipesWithDisplayData.filter(
            (
              recipe
            ) => {

              /* =====================
                 Search
              ===================== */

              const matchesSearch =
                keyword ===
                  '' ||
                String(
                  recipe.name ||
                  ''
                )
                  .toLowerCase()
                  .includes(
                    keyword
                  ) ||
                (
                  recipe.ingredients ||
                  []
                ).some(
                  (
                    ingredient
                  ) =>
                    String(
                      ingredient.name ||
                      ''
                    )
                      .toLowerCase()
                      .includes(
                        keyword
                      )
                ) ||
                recipe.tags.some(
                  (
                    tag
                  ) =>
                    String(
                      tag
                    )
                      .toLowerCase()
                      .includes(
                        keyword
                      )
                )


              /* =====================
                 Filter
              ===================== */

              const matchesFilter =
                activeFilter ===
                  '全部' ||
                recipe.tags.includes(
                  activeFilter
                )


              /* =====================
                 Recommend / Favourite
              ===================== */

              const matchesTab =
                activeTab ===
                  '推荐' ||
                Boolean(
                  recipe.favorite
                )


              return (
                matchesSearch &&
                matchesFilter &&
                matchesTab
              )
            }
          )


        /* =================================================
           Recommendation Priority

           1. More expiring ingredients
           2. Fewer missing ingredients
           3. Shorter cooking time
        ================================================= */

        if (
          activeTab ===
          '推荐'
        ) {

          result.sort(
            (
              a,
              b
            ) => {

              if (
                a.expiring !==
                b.expiring
              ) {

                return (
                  b.expiring -
                  a.expiring
                )
              }


              if (
                a.missing !==
                b.missing
              ) {

                return (
                  a.missing -
                  b.missing
                )
              }


              return (
                a.cookingTime -
                b.cookingTime
              )
            }
          )
        }


        return result

      },
      [
        recipesWithDisplayData,
        search,
        activeFilter,
        activeTab,
      ]
    )


  /* =====================================================
     Favorite
  ===================================================== */

  const toggleFavorite =
    (
      recipeId
    ) => {

      setRecipeList(
        (
          currentRecipes
        ) =>

          currentRecipes.map(
            (
              recipe
            ) => {

              const currentId =
                getRecipeId(
                  recipe
                )


              if (
                currentId !==
                recipeId
              ) {

                return recipe
              }


              return {

                ...recipe,

                favorite:
                  !recipe.favorite,

              }
            }
          )
      )
    }


  /* =====================================================
     Render
  ===================================================== */

  return (

    <div className="recipes-app">

      <main className="recipes-page">


        {/* =====================
            Title
        ===================== */}

        <header className="recipes-header">

          <h1>
            菜谱
          </h1>

        </header>


        {/* =====================
            Search
        ===================== */}

        <div className="recipes-search">

          <img
            src="/images/icons/icon-search-bar.png"
            alt=""
          />

          <input
            type="text"
            value={
              search
            }
            placeholder="搜索菜名或者食材"

            onChange={
              (
                event
              ) =>
                setSearch(
                  event.target.value
                )
            }
          />

        </div>


        {/* =====================
            Recommend / Favourite
        ===================== */}

        <div className="recipes-main-tabs">

          <button
            type="button"

            className={
              activeTab ===
              '推荐'

                ? 'recipes-main-tab active'

                : 'recipes-main-tab'
            }

            onClick={
              () =>
                setActiveTab(
                  '推荐'
                )
            }
          >
            推荐
          </button>


          <button
            type="button"

            className={
              activeTab ===
              '收藏'

                ? 'recipes-main-tab active'

                : 'recipes-main-tab'
            }

            onClick={
              () =>
                setActiveTab(
                  '收藏'
                )
            }
          >
            收藏
          </button>

        </div>


        {/* =====================
            Filters
        ===================== */}

        <div className="recipe-filters">

          {
            filters.map(
              (
                filter
              ) => (

                <button
                  type="button"

                  key={
                    filter
                  }

                  className={
                    activeFilter ===
                    filter

                      ? 'recipe-filter active'

                      : 'recipe-filter'
                  }

                  onClick={
                    () =>
                      setActiveFilter(
                        filter
                      )
                  }
                >
                  {filter}
                </button>

              )
            )
          }

        </div>


        {/* =====================
            Intro
        ===================== */}

        <section className="recipes-intro">

          <h2>

            {
              activeTab ===
              '推荐'

                ? '菜谱推荐'

                : '我的收藏'
            }

          </h2>


          {
            activeTab ===
              '推荐' && (

              <p>
                优先使用即将到期的食材，库存匹配度高的排在前面
              </p>

            )
          }

        </section>


        {/* =====================
            Recipe List
        ===================== */}

        <section className="recipes-list">

          {
            filteredRecipes.length >
            0

              ? (

                filteredRecipes.map(
                  (
                    recipe
                  ) => {

                    const recipeId =
                      getRecipeId(
                        recipe
                      )


                    return (

                      <article
                        className="recipes-card"

                        key={
                          recipeId
                        }

                        onClick={
                          () =>
                            onOpenRecipe?.(
                              recipe
                            )
                        }
                      >


                        {/* =====================
                            Favorite
                        ===================== */}

                        <button
                          type="button"

                          className="favorite-button"

                          onClick={
                            (
                              event
                            ) => {

                              event.stopPropagation()

                              toggleFavorite(
                                recipeId
                              )
                            }
                          }

                          aria-label={
                            recipe.favorite

                              ? '取消收藏'

                              : '收藏菜谱'
                          }
                        >

                          <img
                            src={
                              recipe.favorite

                                ? '/images/icons/icon-start-2.png'

                                : '/images/icons/icon-start-1.png'
                            }
                            alt=""
                          />

                        </button>


                        {/* =====================
                            Image
                        ===================== */}

                        <img
                          className="recipes-card-image"

                          src={
                            recipe.image
                          }

                          alt={
                            recipe.name
                          }
                        />


                        {/* =====================
                            Content
                        ===================== */}

                        <div className="recipes-card-content">

                          <h3>
                            {recipe.name}
                          </h3>


                          <div className="recipes-tags">


                            {/* Match */}

                            {
                              recipe.missing ===
                              0

                                ? (

                                  <span className="match-tag complete">

                                    <img
                                      src="/images/icons/icon-check-mark.png"
                                      alt=""
                                    />

                                    食材齐全

                                  </span>

                                )

                                : (

                                  <span className="match-tag missing">

                                    <img
                                      src="/images/icons/icon-warning.png"
                                      alt=""
                                    />

                                    缺 {recipe.missing} 样

                                  </span>

                                )
                            }


                            {/* Recipe Tags */}

                            {
                              recipe.tags.map(
                                (
                                  tag
                                ) => (

                                  <span
                                    className="type-tag"

                                    key={
                                      tag
                                    }
                                  >
                                    {tag}
                                  </span>

                                )
                              )
                            }

                          </div>


                          {/* =====================
                              Meta
                          ===================== */}

                          <div className="recipes-meta">

                            <span>

                              {
                                recipe.cookingTime
                              } 分钟

                            </span>

                            <span>
                              ·
                            </span>

                            <span>
                              {recipe.difficulty}
                            </span>

                            <span>
                              ·
                            </span>

                            <span>

                              {
                                recipe.expiring
                              } 种临期食材

                            </span>

                          </div>

                        </div>

                      </article>

                    )
                  }
                )

              )

              : (

                <div className="recipes-empty">

                  <p>

                    {
                      activeTab ===
                      '收藏'

                        ? '还没有收藏的菜谱'

                        : '没有找到符合条件的菜谱'
                    }

                  </p>

                </div>

              )
          }

        </section>

      </main>

    </div>

  )
}


export default Recipes

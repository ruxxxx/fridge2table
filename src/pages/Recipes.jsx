import {
  useMemo,
  useState,
} from 'react'

import recipes from '../data/recipes'

import './Recipes.css'


/* =========================
   Filters
========================= */

const filters = [
  '全部',
  '肉菜',
  '素菜',
  '海鲜',
  '凉菜',
  '清淡',
  '香辣',
]


/* =========================
   Recipe Tags
========================= */

const recipeTags = {
  R001: ['素菜', '香辣'],
  R002: ['素菜', '清淡'],
  R003: ['素菜', '香辣'],
  R004: ['素菜', '清淡'],
  R005: ['素菜', '清淡'],
  R006: ['素菜', '香辣'],
  R007: ['肉菜'],
  R008: ['肉菜'],
  R009: ['素菜', '香辣'],
  R010: ['素菜', '清淡'],
}


/* =========================
   Helpers
========================= */

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

  return (
    Number.parseInt(
      recipe.cooking_time ??
      recipe.cookingTime ??
      recipe.time,
      10
    ) || 0
  )
}


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
   Date
========================= */

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
    (expiry - today) /
      (1000 * 60 * 60 * 24)
  )
}


/* =========================
   Recipe Match
========================= */

function getRecipeMatch(
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


            /*
              兼容旧 localStorage
            */

            const sameName =
              !fridgeIngredientId &&
              String(
                item.name || ''
              ).trim() ===
                String(
                  ingredient.name || ''
                ).trim()


            const notExpired =
              getDaysLeft(
                item.expiryDate
              ) >= 0


            return (
              (
                sameId ||
                sameName
              ) &&
              notExpired
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

         如果数量为空：
         只要有这个食材就算拥有。

         全部库存都有数量时：
         才判断数量够不够。
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

         0 - 4 天内过期
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
   Recipes
========================= */

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


  /* =========================
     Add Match Data
  ========================= */

  const recipesWithDisplayData =
    useMemo(
      () => {

        return recipeList.map(
          (recipe) => {

            const match =
              getRecipeMatch(
                recipe,
                fridgeItems
              )


            const recipeId =
              getRecipeId(
                recipe
              )


            return {
              ...recipe,

              tags:
                recipeTags[
                  recipeId
                ] || [],

              missing:
                match.missing,

              expiring:
                match.expiring,
            }
          }
        )
      },
      [
        recipeList,
        fridgeItems,
      ]
    )


  /* =========================
     Search / Filter / Sort
  ========================= */

  const filteredRecipes =
    useMemo(
      () => {

        const result =
          recipesWithDisplayData.filter(
            (recipe) => {

              const keyword =
                search.trim()


              /* Search */

              const matchesSearch =
                keyword === '' ||

                recipe.name.includes(
                  keyword
                ) ||

                recipe.ingredients.some(
                  (ingredient) =>
                    ingredient.name.includes(
                      keyword
                    )
                ) ||

                recipe.tags.some(
                  (tag) =>
                    tag.includes(
                      keyword
                    )
                )


              /* Filter */

              const matchesFilter =
                activeFilter ===
                  '全部' ||

                recipe.tags.includes(
                  activeFilter
                )


              /* Recommend / Favorite */

              const matchesTab =
                activeTab ===
                  '推荐' ||

                recipe.favorite


              return (
                matchesSearch &&
                matchesFilter &&
                matchesTab
              )
            }
          )


        /* =====================
           Recommendation Sort

           1. 临期食材越多越前
           2. 缺少食材越少越前
           3. 烹饪时间越短越前
        ===================== */

        if (
          activeTab ===
          '推荐'
        ) {

          result.sort(
            (
              a,
              b
            ) => {


              /* =====================
                 1. Expiring First
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
                 2. Missing Fewer
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
                 3. Faster Recipe
              ===================== */

              return (
                getRecipeTime(
                  a
                ) -
                getRecipeTime(
                  b
                )
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


  /* =========================
     Favorite
  ========================= */

  const toggleFavorite =
    (
      id
    ) => {

      setRecipeList(
        (
          currentRecipes
        ) =>

          currentRecipes.map(
            (recipe) => {

              const recipeId =
                getRecipeId(
                  recipe
                )


              return (
                recipeId === id
                  ? {
                      ...recipe,

                      favorite:
                        !recipe.favorite,
                    }

                  : recipe
              )
            }
          )
      )
    }


  /* =========================
     Render
  ========================= */

  return (

    <div className="recipes-app">

      <main className="recipes-page">


        {/* Title */}

        <header className="recipes-header">

          <h1>
            菜谱
          </h1>

        </header>


        {/* Search */}

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
                  event.target
                    .value
                )
            }

          />

        </div>


        {/* Recommend / Favourite */}

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


        {/* Filters */}

        <div className="recipe-filters">

          {filters.map(
            (filter) => (

              <button

                key={
                  filter
                }

                type="button"

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
          )}

        </div>


        {/* Intro */}

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


        {/* Recipe List */}

        <section className="recipes-list">

          {
            filteredRecipes.length >
            0 ? (

              filteredRecipes.map(
                (recipe) => {

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
                          onOpenRecipe(
                            recipe
                          )
                      }

                    >


                      {/* Favorite */}

                      <button

                        className="favorite-button"

                        type="button"

                        onClick={
                          (
                            event
                          ) => {

                            event
                              .stopPropagation()


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


                      {/* Image */}

                      <img

                        className="recipes-card-image"

                        src={
                          recipe.image
                        }

                        alt={
                          recipe.name
                        }

                      />


                      {/* Content */}

                      <div className="recipes-card-content">


                        <h3>
                          {recipe.name}
                        </h3>


                        <div className="recipes-tags">


                          {
                            recipe.missing ===
                            0 ? (

                              <span className="match-tag complete">

                                <img
                                  src="/images/icons/icon-check-mark.png"
                                  alt=""
                                />

                                食材齐全

                              </span>

                            ) : (

                              <span className="match-tag missing">

                                <img
                                  src="/images/icons/icon-warning.png"
                                  alt=""
                                />

                                缺 {recipe.missing} 样

                              </span>

                            )
                          }


                          {
                            recipe.tags.map(
                              (tag) => (

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


                        <div className="recipes-meta">

                          <span>

                            {
                              getRecipeTime(
                                recipe
                              )
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

            ) : (

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
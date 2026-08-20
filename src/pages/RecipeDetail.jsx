import {
  useMemo,
  useState,
} from 'react'

import './RecipeDetail.css'


/* =========================
   Helpers
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


function getRecipeTime(
  recipe
) {

  return (
    Number.parseInt(
      recipe?.cooking_time ??
      recipe?.cookingTime ??
      recipe?.time,
      10
    ) || 0
  )
}


/* =========================
   Ingredient Decision Key
========================= */

function getIngredientDecisionKey(
  ingredient
) {

  const id =
    normalizeIngredientId(
      ingredient.ingredient_id ??
      ingredient.ingredientId
    )


  return (
    id ||
    `name:${ingredient.name}`
  )
}


/* =========================
   Date / Stock Helpers
========================= */

function getToday() {

  const today =
    new Date()


  today.setHours(
    0,
    0,
    0,
    0
  )


  return today
}


function getDaysLeft(
  expiryDate
) {

  const today =
    getToday()


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


function formatReceiptDate() {

  const now =
    new Date()


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    )


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    )


  const year =
    now.getFullYear()


  const hour =
    String(
      now.getHours()
    ).padStart(
      2,
      '0'
    )


  const minute =
    String(
      now.getMinutes()
    ).padStart(
      2,
      '0'
    )


  return {

    date:
      `${day}/${month}/${year}`,

    time:
      `${hour}:${minute}`,

  }
}


/* =========================
   Match Fridge Item
========================= */

function isSameIngredient(
  ingredient,
  fridgeItem
) {

  const recipeIngredientId =
    normalizeIngredientId(
      ingredient.ingredient_id ??
      ingredient.ingredientId
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
    兼容旧 localStorage：
    如果旧库存没有 ID，
    用名称匹配
  */

  const sameName =
    !fridgeIngredientId &&
    String(
      fridgeItem.name || ''
    ).trim() ===
      String(
        ingredient.name || ''
      ).trim()


  return (
    sameId ||
    sameName
  )
}


/* =========================
   Unknown Quantity
========================= */

function isUnknownQuantity(
  quantity
) {

  return (
    quantity === null ||
    quantity === undefined ||
    quantity === '' ||
    !Number.isFinite(
      Number(
        quantity
      )
    )
  )
}


function hasUnknownQuantityStock(
  ingredient,
  fridgeItems
) {

  return fridgeItems.some(
    (item) => {

      const sameIngredient =
        isSameIngredient(
          ingredient,
          item
        )


      const notExpired =
        getDaysLeft(
          item.expiryDate
        ) >= 0


      return (
        sameIngredient &&
        notExpired &&
        isUnknownQuantity(
          item.quantity
        )
      )
    }
  )
}


/* =========================
   Ingredient Stock Status
========================= */

function getIngredientStatus(
  ingredient,
  fridgeItems
) {

  const validBatches =
    fridgeItems.filter(
      (item) => {

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
    validBatches.length ===
    0
  ) {

    return {
      type: 'missing',
      text: '缺少',
    }
  }


  /* =====================
     Quantity Check

     如果数量没有记录，
     只要存在这个食材，
     就认为目前有库存。

     完成烹饪时再问：
     还有 / 用完了
  ===================== */

  const hasUnknownQuantity =
    validBatches.some(
      (item) =>
        isUnknownQuantity(
          item.quantity
        )
    )


  if (
    !hasUnknownQuantity
  ) {

    const availableQuantity =
      validBatches.reduce(
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

      return {
        type: 'missing',
        text: '缺少',
      }
    }
  }


  /* =====================
     Earliest Expiry
  ===================== */

  const expiringBatch =
    validBatches
      .slice()
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            a.expiryDate
          ) -
          new Date(
            b.expiryDate
          )
      )[0]


  const daysLeft =
    getDaysLeft(
      expiringBatch
        .expiryDate
    )


  /* =====================
     Expiring
  ===================== */

  if (
    daysLeft <= 4
  ) {

    return {
      type: 'expiring',

      text:
        daysLeft === 0
          ? '今天过期'
          : `${daysLeft}天后过期`,
    }
  }


  /* =====================
     Fresh
  ===================== */

  return {
    type: 'fresh',
    text: '新鲜',
  }
}


/* =========================
   Component
========================= */

function RecipeDetail({

  recipe,

  fridgeItems = [],

  shoppingItems = [],

  onAddToShoppingList,

  onFinishCooking,

  onBack,

}) {


  const [
    showReceipt,
    setShowReceipt,
  ] = useState(
    false
  )


  const [
    unknownDecisions,
    setUnknownDecisions,
  ] = useState(
    {}
  )


  /*
    Hooks 必须每次 render 都执行，
    所以这里使用 optional chaining。
  */

  const recipeIngredients =
    recipe?.ingredients ||
    []


  /* =========================
     Missing Count
  ========================= */

  const missingCount =
    useMemo(
      () =>

        recipeIngredients.filter(
          (ingredient) =>

            getIngredientStatus(
              ingredient,
              fridgeItems
            ).type ===
              'missing'
        ).length,

      [
        recipeIngredients,
        fridgeItems,
      ]
    )


  if (
    !recipe
  ) {
    return null
  }


  const receiptTime =
    formatReceiptDate()


  const cookingTime =
    getRecipeTime(
      recipe
    )


  /* =========================
     Display Tag
  ========================= */

  const displayTag =
    recipe.tags?.[0] ||
    recipe.category ||
    ''


  /* =========================
     Shopping List Check
  ========================= */

  const isInShoppingList =
    (ingredient) => {

      const ingredientId =
        normalizeIngredientId(
          ingredient.ingredient_id ??
          ingredient.ingredientId
        )


      return shoppingItems.some(
        (item) => {

          const shoppingIngredientId =
            normalizeIngredientId(
              item.ingredientId ??
              item.ingredient_id
            )


          const sameId =
            Boolean(
              ingredientId &&
              shoppingIngredientId
            ) &&
            ingredientId ===
              shoppingIngredientId


          const sameName =
            !shoppingIngredientId &&
            item.name ===
              ingredient.name


          return (
            (
              sameId ||
              sameName
            ) &&
            !item.purchased
          )
        }
      )
    }


  /* =========================
     Open Receipt
  ========================= */

  const handleOpenReceipt =
    () => {

      /*
        每次打开重新选择，
        避免上一次的结果残留
      */

      setUnknownDecisions(
        {}
      )


      setShowReceipt(
        true
      )
    }


  /* =========================
     Close Receipt
  ========================= */

  const handleCloseReceipt =
    () => {

      setUnknownDecisions(
        {}
      )


      setShowReceipt(
        false
      )
    }


  /* =========================
     Finish Cooking
  ========================= */

  const handleConfirmCooking =
    () => {


      /* =====================
         找出数量未知的食材
      ===================== */

      const unknownIngredients =
        recipeIngredients.filter(
          (ingredient) =>

            hasUnknownQuantityStock(
              ingredient,
              fridgeItems
            )
        )


      /* =====================
         是否全部回答
      ===================== */

      const hasUnanswered =
        unknownIngredients.some(
          (ingredient) => {

            const key =
              getIngredientDecisionKey(
                ingredient
              )


            return (
              !unknownDecisions[
                key
              ]
            )
          }
        )


      if (
        hasUnanswered
      ) {

        window.alert(
          '请确认数量未记录的食材使用后是否还有剩余。'
        )

        return
      }


      /*
        把选择一起交给 App.jsx：

        stillHave = 还有
        usedUp    = 用完了
      */

      const result =
        onFinishCooking?.(
          recipe,
          unknownDecisions
        )


      /*
        App 返回 false：
        库存不足，
        不关闭 Receipt。
      */

      if (
        result === false
      ) {
        return
      }


      setUnknownDecisions(
        {}
      )


      setShowReceipt(
        false
      )
    }


  /* =========================
     Render
  ========================= */

  return (

    <div className="detail-app">


      {/* =====================
          Hero
      ===================== */}

      <section className="detail-hero">


        <img

          className="detail-hero-image"

          src={
            recipe.image
          }

          alt={
            recipe.name
          }

        />


        <button

          className="detail-back"

          type="button"

          onClick={
            onBack
          }

        >

          <img

            src="/images/icons/icon-left-arrow.png"

            alt=""

          />

        </button>


        <div className="detail-hero-bottom">


          <h1>
            {recipe.name}
          </h1>


          <div className="detail-hero-tags">


            {
              missingCount >
              0 ? (

                <span className="detail-missing-tag">

                  <img

                    src="/images/icons/icon-warning.png"

                    alt=""

                  />

                  缺 {missingCount} 样

                </span>

              ) : (

                <span className="detail-type-tag">

                  食材齐全

                </span>

              )
            }


            {
              displayTag && (

                <span className="detail-type-tag">

                  {displayTag}

                </span>

              )
            }

          </div>

        </div>

      </section>


      {/* =====================
          Main
      ===================== */}

      <main className="detail-content">


        {/* =====================
            Summary
        ===================== */}

        <section className="detail-summary-card">


          <div className="detail-summary-meta">


            {/* Time */}

            <div className="detail-summary-item">

              <img

                src="/images/icons/icon-duration.png"

                alt=""

              />

              <span>

                {cookingTime} 分钟

              </span>

            </div>


            {/* People */}

            <div className="detail-summary-item">

              <img

                src="/images/icons/icon-people.png"

                alt=""

              />

              <span>

                1 人份

              </span>

            </div>


            {/* Difficulty */}

            <div className="detail-summary-item">

              <img

                src="/images/icons/icon-difficulty.png"

                alt=""

              />

              <span>

                {recipe.difficulty}

              </span>

            </div>

          </div>


          {
            recipe.description && (
              <>

                <div className="detail-summary-divider" />

                <p className="detail-description">

                  {recipe.description}

                </p>

              </>
            )
          }

        </section>


        {/* =====================
            Ingredients
        ===================== */}

        <section className="detail-section">


          <div className="detail-section-header">

            <h2>
              所需食材
            </h2>

            <span>

              {recipeIngredients.length} 项

            </span>

          </div>


          <div className="detail-ingredients-list">


            {
              recipeIngredients.map(
                (
                  ingredient,
                  index
                ) => {


                  const status =
                    getIngredientStatus(
                      ingredient,
                      fridgeItems
                    )


                  const alreadyAdded =
                    isInShoppingList(
                      ingredient
                    )


                  const ingredientKey =
                    getIngredientDecisionKey(
                      ingredient
                    ) ||
                    `${ingredient.name}-${index}`


                  return (

                    <div

                      className={`detail-ingredient-row ${
                        status.type ===
                        'missing'
                          ? 'missing'
                          : ''
                      }`}

                      key={
                        ingredientKey
                      }

                    >


                      <div className="detail-ingredient-left">


                        {/* Status Icon */}

                        <img

                          className="detail-status-icon"

                          src={
                            status.type ===
                            'missing'

                              ? '/images/icons/icon-warning.png'

                              : '/images/icons/icon-check-mark.png'
                          }

                          alt=""

                        />


                        {/* Name */}

                        <span className="detail-ingredient-name">

                          {ingredient.name}

                        </span>


                        {/* Fresh / Expiring */}

                        {
                          status.type !==
                            'missing' && (
                            <>

                              <span

                                className={`detail-dot ${status.type}`}

                              />

                              <span

                                className={`detail-ingredient-status ${status.type}`}

                              >

                                {status.text}

                              </span>

                            </>
                          )
                        }


                        {/* Missing */}

                        {
                          status.type ===
                            'missing' && (
                            <>

                              <span className="detail-ingredient-status missing">

                                缺少

                              </span>


                              {
                                alreadyAdded ? (

                                  <span className="detail-added-list">

                                    已加入清单

                                  </span>

                                ) : (

                                  <button

                                    className="detail-add-list"

                                    type="button"

                                    onClick={
                                      () =>
                                        onAddToShoppingList?.(
                                          ingredient,
                                          recipe.name
                                        )
                                    }

                                  >

                                    <img

                                      src="/images/icons/icon-add-orange.png"

                                      alt=""

                                    />

                                    加入清单

                                  </button>

                                )
                              }

                            </>
                          )
                        }

                      </div>


                      {/* Quantity */}

                      <span className="detail-ingredient-quantity">

                        {ingredient.quantity}{' '}
                        {ingredient.unit}

                      </span>

                    </div>

                  )
                }
              )
            }

          </div>

        </section>


        {/* =====================
            Seasonings
        ===================== */}

        <section className="detail-section">

          <div className="detail-section-header">

            <h2>
              所需调料
            </h2>

            <span>
              {(recipe.seasonings || []).length} 项
            </span>

          </div>


          <div className="detail-ingredients-list">

            {
              (recipe.seasonings || []).map(
                (
                  seasoning,
                  index
                ) => {


                  let seasoningName = ''
                  let seasoningAmount = ''


                  if (
                    typeof seasoning ===
                    'string'
                  ) {

                    seasoningName =
                      seasoning

                  } else if (
                    seasoning &&
                    typeof seasoning ===
                      'object'
                  ) {

                    const entry =
                      Object.entries(
                        seasoning
                      )[0]


                    if (
                      entry
                    ) {

                      seasoningName =
                        entry[0]

                      seasoningAmount =
                        entry[1]
                    }
                  }


                  return (

                    <div

                      className="detail-ingredient-row"

                      key={`seasoning-${index}`}

                    >

                      <div className="detail-ingredient-left">

                        <span className="detail-ingredient-name">

                          {seasoningName}

                        </span>

                      </div>


                      {
                        seasoningAmount && (

                          <span className="detail-ingredient-quantity">

                            {seasoningAmount}

                          </span>

                        )
                      }

                    </div>

                  )
                }
              )
            }

          </div>

        </section>


        {/* =====================
            Cooking Steps
        ===================== */}

        <section className="detail-section steps-section">

          <h2>
            烹饪步骤
          </h2>


          <div className="detail-steps">


            {
              (
                recipe.steps ||
                []
              ).map(
                (
                  step,
                  index
                ) => (

                  <div

                    className="detail-step"

                    key={
                      index
                    }

                  >

                    <div className="detail-step-marker">

                      <span>

                        {index + 1}

                      </span>

                    </div>


                    <p>

                      {step}

                    </p>

                  </div>

                )
              )
            }

          </div>

        </section>


        {/* =====================
            Finish Cooking
        ===================== */}

        <button

          className="finish-cooking-button"

          type="button"

          onClick={
            handleOpenReceipt
          }

        >

          完成烹饪

        </button>

      </main>


      {/* =====================================================
          COOKING RECEIPT
      ===================================================== */}

      {
        showReceipt && (

          <div className="cooking-receipt-overlay">


            <div className="cooking-receipt">


              {/* Header */}

              <div className="receipt-title">

                THE COOKING RECEIPT

              </div>


              <div className="receipt-branch">

                BRANCH: Fridge2Table

              </div>


              <p className="receipt-message">

                本次使用的食材将从你的冰箱库存中扣除

              </p>


              {/* Date */}

              <div className="receipt-date-row">


                <span>

                  {receiptTime.date}{' '}
                  {receiptTime.time}

                </span>


                <span>

                  #
                  {
                    String(
                      Date.now()
                    ).slice(
                      -8
                    )
                  }

                </span>

              </div>


              <div className="receipt-line" />


              {/* =====================
                  Ingredient List
              ===================== */}

 <div className="receipt-items">

  {
    recipeIngredients.map(
      (
        ingredient,
        index
      ) => {

        const ingredientKey =
          getIngredientDecisionKey(
            ingredient
          ) ||
          `${ingredient.name}-${index}`


        const unknownQuantity =
          hasUnknownQuantityStock(
            ingredient,
            fridgeItems
          )


        const decision =
          unknownDecisions[
            ingredientKey
          ]


        return (

          <div
            className="receipt-item"
            key={
              ingredientKey
            }
          >

            <div className="receipt-item-left">

              <span>
                {ingredient.name}
              </span>


              {unknownQuantity && (

                <div className="receipt-stock-buttons">


                  <button

                    type="button"

                    className={
                      decision ===
                      'stillHave'
                        ? 'receipt-stock-button active'
                        : 'receipt-stock-button'
                    }

                    onClick={
                      () =>
                        setUnknownDecisions(
                          (current) => ({

                            ...current,

                            [ingredientKey]:
                              'stillHave',

                          })
                        )
                    }

                  >
                    还有
                  </button>


                  <button

                    type="button"

                    className={
                      decision ===
                      'usedUp'
                        ? 'receipt-stock-button active'
                        : 'receipt-stock-button'
                    }

                    onClick={
                      () =>
                        setUnknownDecisions(
                          (current) => ({

                            ...current,

                            [ingredientKey]:
                              'usedUp',

                          })
                        )
                    }

                  >
                    没了
                  </button>

                </div>

              )}

            </div>


            <span>

              {ingredient.quantity}{' '}
              {ingredient.unit}

            </span>

          </div>

        )
      }
    )
  }

</div>
              {/* Recipe */}

              <div className="receipt-label-row">

                <span>

                  RECIPE

                </span>

                <span>

                  {recipe.name}

                </span>

              </div>


              <div className="receipt-dashed-line" />


              {/* Bottom Info */}

              <div className="receipt-summary-row">


                <div>

                  <strong>

                    COOKING TIME

                  </strong>

                  <span>

                    ITEM COUNT:{' '}
                    {recipeIngredients.length}

                  </span>

                </div>


                <div className="receipt-summary-right">

                  <strong>

                    {cookingTime} mins

                  </strong>

                  <span>

                    TAX INCL.

                  </span>

                </div>

              </div>


              {/* Actions */}

              <div className="receipt-actions">


                <button

                  className="receipt-cancel"

                  type="button"

                  onClick={
                    handleCloseReceipt
                  }

                >

                  取消

                </button>


                <button

                  className="receipt-confirm"

                  type="button"

                  onClick={
                    handleConfirmCooking
                  }

                >

                  确认

                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>
  )
}


export default RecipeDetail
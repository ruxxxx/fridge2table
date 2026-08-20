import {
  useEffect,
  useState,
} from 'react'


/* =========================
   Pages
========================= */

import Home from './pages/Home'

import Fridge from './pages/Fridge'
import FridgeAdd from './pages/FridgeAdd'
import FridgeBrowse from './pages/FridgeBrowse'
import FridgeEdit from './pages/FridgeEdit'

import FridgeReceiptScan from './pages/FridgeReceiptScan'
import FridgeReceiptResult from './pages/FridgeReceiptResult'

import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'

import ShoppingList from './pages/ShoppingList'
import ShoppingAdd from './pages/ShoppingAdd'


/* =========================
   Components
========================= */

import BottomNav from './components/BottomNav'
import Toast from './components/Toast'


/* =========================
   Data
========================= */

import ingredients from './data/ingredients'


/* =========================
   Utils
========================= */

import {
  parseReceiptText,
} from './utils/receiptParser'


/* =========================================================
   HELPERS
========================================================= */

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


/* =========================================================
   Find Ingredient
========================================================= */

function findIngredientInfo({
  ingredientId,
  name,
}) {

  const normalizedId =
    normalizeIngredientId(
      ingredientId
    )


  const cleanName =
    String(
      name || ''
    ).trim()


  return (
    ingredients.find(
      (ingredient) => {

        const masterId =
          normalizeIngredientId(
            ingredient
              .ingredient_id
          )


        const sameId =
          Boolean(
            normalizedId &&
            masterId
          ) &&
          normalizedId ===
            masterId


        const sameName =
          cleanName &&
          ingredient.name ===
            cleanName


        const sameKeyword =
          cleanName &&
          ingredient
            .keywords
            ?.includes(
              cleanName
            )


        return (
          sameId ||
          sameName ||
          sameKeyword
        )
      }
    ) || null
  )
}


/* =========================================================
   Category
========================================================= */

function normalizeCategory(
  category
) {

  if (
    category ===
    '蔬菜'
  ) {
    return '果蔬'
  }


  return (
    category ||
    '其他'
  )
}


/* =========================================================
   APP
========================================================= */

function App() {

    const [
    toast,
    setToast,
  ] = useState({
    message: '',
    id: 0,
  })


  const showToast = (
    message
  ) => {

    setToast({
      message,
      id: Date.now(),
    })
  }


  useEffect(
    () => {

      if (
        !toast.message
      ) {
        return
      }


      const timer =
        setTimeout(
          () => {

            setToast({
              message: '',
              id: 0,
            })

          },
          2200
        )


      return () =>
        clearTimeout(
          timer
        )

    },
    [
      toast.id,
    ]
  )

  /* =========================================================
     PAGE
  ========================================================= */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(
    'home'
  )


  /* =========================================================
     RECIPE
  ========================================================= */

  const [
    selectedRecipe,
    setSelectedRecipe,
  ] = useState(
    null
  )


  /* =========================================================
     FRIDGE ADD PRESET
  ========================================================= */

  const [
    fridgeAddPreset,
    setFridgeAddPreset,
  ] = useState(
    null
  )


  /* =========================================================
     FRIDGE EDIT
  ========================================================= */

  const [
    selectedFridgeItem,
    setSelectedFridgeItem,
  ] = useState(
    null
  )


  /* =========================================================
     RECEIPT
  ========================================================= */

  const [
    capturedReceiptImage,
    setCapturedReceiptImage,
  ] = useState(
    null
  )


  const [
    receiptResultItems,
    setReceiptResultItems,
  ] = useState(
    []
  )


  /* =========================================================
     FRIDGE STATE
  ========================================================= */

  const [
    fridgeItems,
    setFridgeItems,
  ] = useState(
    () => {

      const saved =
        localStorage.getItem(
          'fridgeItems'
        )


      if (
        saved
      ) {

        try {

          return JSON
            .parse(
              saved
            )
            .map(
              (item) => {

                /*
                  兼容之前存在 localStorage
                  里的旧库存数据
                */

                const info =
                  findIngredientInfo({
                    ingredientId:
                      item.ingredientId ??
                      item.ingredient_id,

                    name:
                      item.name,
                  })


                return {

                  ...item,

                  ingredientId:
                    info
                      ?.ingredient_id ||
                    item
                      .ingredientId ||
                    item
                      .ingredient_id ||
                    null,

                  name:
                    info?.name ||
                    item.name,

                  category:
                    normalizeCategory(
                      item.category ||
                      info?.category
                    ),

                  unit:
                    item.unit ||
                    info
                      ?.default_unit ||
                    '个',

                  image:
                    item.image ||
                    info?.image ||
                    '',

                  addedDate:
                    new Date(
                      item.addedDate
                    ),

                  expiryDate:
                    new Date(
                      item.expiryDate
                    ),

                }
              }
            )

        } catch {

          return []
        }
      }


      return []
    }
  )


  /* =========================
     Save Fridge
  ========================= */

  useEffect(
    () => {

      localStorage.setItem(
        'fridgeItems',

        JSON.stringify(
          fridgeItems
        )
      )

    },
    [
      fridgeItems,
    ]
  )


  /* =========================================================
     SHOPPING STATE
  ========================================================= */

  const [
    shoppingItems,
    setShoppingItems,
  ] = useState(
    () => {

      const saved =
        localStorage.getItem(
          'shoppingItems'
        )


      if (
        saved
      ) {

        try {

          return JSON.parse(
            saved
          )

        } catch {

          return []
        }
      }


      return []
    }
  )


  /* =========================
     Save Shopping
  ========================= */

  useEffect(
    () => {

      localStorage.setItem(
        'shoppingItems',

        JSON.stringify(
          shoppingItems
        )
      )

    },
    [
      shoppingItems,
    ]
  )


  /* =========================================================
     SHOPPING USAGE
  ========================================================= */

  const [
    shoppingUsage,
    setShoppingUsage,
  ] = useState(
    () => {

      const saved =
        localStorage.getItem(
          'shoppingUsage'
        )


      if (
        saved
      ) {

        try {

          return JSON.parse(
            saved
          )

        } catch {

          return {}
        }
      }


      return {}
    }
  )


  useEffect(
    () => {

      localStorage.setItem(
        'shoppingUsage',

        JSON.stringify(
          shoppingUsage
        )
      )

    },
    [
      shoppingUsage,
    ]
  )


  /* =========================================================
     ADD ONE FRIDGE ITEM
  ========================================================= */

  const addFridgeItem =
    (
      newItem
    ) => {

      setFridgeItems(
        (
          currentItems
        ) => {

          const highest =
            currentItems.reduce(
              (
                result,
                item
              ) => {

                const number =
                  Number(
                    String(
                      item.id
                    ).replace(
                      'f',
                      ''
                    )
                  ) || 0


                return Math.max(
                  result,
                  number
                )
              },
              0
            )


          const id =
            `f${String(
              highest + 1
            ).padStart(
              3,
              '0'
            )}`


          return [
            ...currentItems,

            {
              ...newItem,
              id,
            },
          ]
        }
      )


      setFridgeAddPreset(
        null
      )


      setCurrentPage(
        'fridge'
      )
    }


  /* =========================================================
     ADD MULTIPLE FRIDGE ITEMS
  ========================================================= */

  const addMultipleFridgeItems =
    (
      newItems
    ) => {

      if (
        !newItems ||
        newItems.length === 0
      ) {
        return
      }


      setFridgeItems(
        (
          currentItems
        ) => {

          const highest =
            currentItems.reduce(
              (
                result,
                item
              ) => {

                const number =
                  Number(
                    String(
                      item.id
                    ).replace(
                      'f',
                      ''
                    )
                  ) || 0


                return Math.max(
                  result,
                  number
                )
              },
              0
            )


          let nextNumber =
            highest + 1


          const itemsWithIds =
            newItems.map(
              (item) => {

                const fridgeItem = {

                  ...item,

                  id:
                    `f${String(
                      nextNumber
                    ).padStart(
                      3,
                      '0'
                    )}`,

                }


                nextNumber += 1


                return fridgeItem
              }
            )


          return [
            ...currentItems,
            ...itemsWithIds,
          ]
        }
      )


      setFridgeAddPreset(
        null
      )


      setCurrentPage(
        'fridge'
      )
    }


  /* =========================================================
     OPEN FRIDGE ADD
  ========================================================= */

  const openFridgeAdd =
    (
      ingredientId = null
    ) => {

      setFridgeAddPreset(
        ingredientId
      )


      setCurrentPage(
        'fridgeAdd'
      )
    }


  /* =========================================================
     OPEN FRIDGE EDIT
  ========================================================= */

  const openFridgeEdit =
    (
      item
    ) => {

      setSelectedFridgeItem(
        item
      )


      setCurrentPage(
        'fridgeEdit'
      )
    }


  /* =========================================================
     UPDATE FRIDGE ITEM
  ========================================================= */

  const updateFridgeItem =
    (
      updatedItem
    ) => {

      setFridgeItems(
        (
          currentItems
        ) =>

          currentItems.map(
            (item) =>

              item.id ===
              updatedItem.id

                ? updatedItem

                : item
          )
      )


      setSelectedFridgeItem(
        null
      )


      setCurrentPage(
        'fridge'
      )
    }


  /* =========================================================
     ADD SHOPPING ITEM
  ========================================================= */

  const addShoppingItem =
    (
      newItem
    ) => {

      const cleanName =
        String(
          newItem.name ||
          ''
        ).trim()


      if (
        !cleanName
      ) {
        return
      }


      const incomingIngredientId =
        normalizeIngredientId(
          newItem.ingredientId ??
          newItem.ingredient_id
        )


      const quantity =
        Number(
          newItem.quantity
        ) || 1


      const unit =
        newItem.unit ||
        '个'


      setShoppingItems(
        (
          currentItems
        ) => {

          const existing =
            currentItems.find(
              (item) => {

                const itemIngredientId =
                  normalizeIngredientId(
                    item.ingredientId ??
                    item.ingredient_id
                  )


                const sameIngredient =
                  incomingIngredientId

                    ? itemIngredientId ===
                      incomingIngredientId

                    : (
                        !itemIngredientId &&
                        item.name ===
                          cleanName
                      )


                return (
                  sameIngredient &&
                  !item.purchased &&
                  item.unit ===
                    unit
                )
              }
            )


          /* =====================
             Existing Item
          ===================== */

          if (
            existing
          ) {

            return currentItems.map(
              (item) =>

                item.id ===
                existing.id

                  ? {

                      ...item,

                      quantity:
                        Number(
                          item.quantity
                        ) +
                        quantity,

                      note:
                        item.note ||
                        newItem.note ||
                        null,

                      source:
                        item.source ||
                        newItem.source ||
                        null,

                    }

                  : item
            )
          }


          /* =====================
             New Shopping ID
          ===================== */

          const highest =
            currentItems.reduce(
              (
                result,
                item
              ) => {

                const number =
                  Number(
                    String(
                      item.id
                    ).replace(
                      's',
                      ''
                    )
                  ) || 0


                return Math.max(
                  result,
                  number
                )
              },
              0
            )


          const id =
            `s${String(
              highest + 1
            ).padStart(
              3,
              '0'
            )}`


          return [
            ...currentItems,

            {

              id,

              ingredientId:
                incomingIngredientId ||
                null,

              name:
                cleanName,

              quantity,

              unit,

              purchased:
                false,

              source:
                newItem.source ||
                null,

              note:
                newItem.note ||
                null,

            },
          ]
        }
      )


      /* =========================
         Shopping Usage
      ========================= */

      const usageKey =
        incomingIngredientId

          ? incomingIngredientId

          : `custom:${cleanName}`


      setShoppingUsage(
        (
          currentUsage
        ) => {

          const existing =
            currentUsage[
              usageKey
            ]


          return {

            ...currentUsage,

            [usageKey]: {

              ingredientId:
                incomingIngredientId ||
                null,

              name:
                cleanName,

              unit,

              count:
                (
                  existing?.count ||
                  0
                ) + 1,

            },
          }
        }
      )
    }


  /* =========================================================
     RECIPE → SHOPPING
  ========================================================= */

  const addToShoppingList =
    (
      ingredient,
      recipeName
    ) => {

      addShoppingItem({

        ingredientId:
          ingredient
            .ingredient_id ??
          ingredient
            .ingredientId,

        name:
          ingredient.name,

        quantity:
          ingredient.quantity,

        unit:
          ingredient.unit,

        source:
          recipeName,

        note:
          null,

      })
    }


  /* =========================================================
     SHOPPING → FRIDGE
  ========================================================= */

  const addPurchasedToFridge =
    () => {

      const purchased =
        shoppingItems.filter(
          (item) =>
            item.purchased
        )


      if (
        purchased.length ===
        0
      ) {
        return
      }


      setFridgeItems(
        (
          currentFridge
        ) => {

          const numbers =
            currentFridge.map(
              (item) =>

                Number(
                  String(
                    item.id
                  ).replace(
                    'f',
                    ''
                  )
                ) || 0
            )


          let nextNumber =
            numbers.length

              ? Math.max(
                  ...numbers
                ) + 1

              : 1


          const today =
            new Date()


          today.setHours(
            0,
            0,
            0,
            0
          )


          const newItems =
            purchased.map(
              (
                shoppingItem
              ) => {


                /* =====================
                   Find Master Ingredient
                ===================== */

                const info =
                  findIngredientInfo({

                    ingredientId:
                      shoppingItem
                        .ingredientId ??
                      shoppingItem
                        .ingredient_id,

                    name:
                      shoppingItem.name,

                  })


                /* =====================
                   Shelf Life

                   数据库没有的自定义食材
                   默认 7 天
                ===================== */

                const shelfLife =
                  Number(
                    info
                      ?.default_shelf_life ??
                    7
                  )


                const expiryDate =
                  new Date(
                    today
                  )


                expiryDate.setDate(
                  expiryDate.getDate() +
                  shelfLife
                )


                /* =====================
                   Create Fridge Item
                ===================== */

                const item = {

                  id:
                    `f${String(
                      nextNumber
                    ).padStart(
                      3,
                      '0'
                    )}`,

                  ingredientId:
                    info
                      ?.ingredient_id ||
                    shoppingItem
                      .ingredientId ||
                    shoppingItem
                      .ingredient_id ||
                    null,

                  name:
                    info?.name ||
                    shoppingItem.name,

                  category:
                    normalizeCategory(
                      info?.category
                    ),

                  quantity:
                    shoppingItem
                      .quantity ??
                    null,

                  unit:
                    shoppingItem.unit ||
                    info
                      ?.default_unit ||
                    '个',

                  image:
                    info?.image ||
                    '',

                  addedDate:
                    new Date(
                      today
                    ),

                  expiryDate,

                }


                nextNumber += 1


                return item
              }
            )


          return [
            ...currentFridge,
            ...newItems,
          ]
        }
      )


      /* =====================
         Remove Purchased
      ===================== */

      setShoppingItems(
        (
          currentItems
        ) =>

          currentItems.filter(
            (item) =>
              !item.purchased
          )
      )

      showToast(
  '已加入冰箱'
)
    }


  /* =========================================================
     RECEIPT SCAN
  ========================================================= */

  const openReceiptScan =
    () => {

      setCapturedReceiptImage(
        null
      )


      setReceiptResultItems(
        []
      )


      setCurrentPage(
        'fridgeReceiptScan'
      )
    }


  /* =========================================================
     OCR RESULT
  ========================================================= */

  const handleReceiptCapture =
    (
      imageData,
      ocrText
    ) => {

      setCapturedReceiptImage(
        imageData
      )


      console.log(
        'OCR TEXT:',
        ocrText
      )


      const parsedItems =
        parseReceiptText(
          ocrText
        )


      console.log(
        'PARSED INGREDIENTS:',
        parsedItems
      )


      setReceiptResultItems(
        parsedItems
      )


      setCurrentPage(
        'fridgeReceiptResult'
      )
    }


  /* =========================================================
     RECEIPT RESULT → FRIDGE
  ========================================================= */

  const addReceiptItemsToFridge =
    (
      newItems
    ) => {

      addMultipleFridgeItems(
        newItems
      )


      setReceiptResultItems(
        []
      )


      setCapturedReceiptImage(
        null
      )
    }


  /* =========================================================
     COMPLETE COOKING
     FEFO
  ========================================================= */

  const finishCooking =
    (
      recipe,
      unknownDecisions = {}
    ) => {

      const ingredientsToUse =
        recipe.ingredients ||
        []


      /*
        数量未知，并且用户选择「用完了」的库存，
        最后统一删除。
      */

      const unknownItemsToRemove =
        new Set()


      /*
        使用副本。

        所有库存确认没有问题以后，
        才真正更新冰箱。
      */

      const nextFridgeItems =
        fridgeItems.map(
          (item) => ({
            ...item,
          })
        )


      const today =
        new Date()


      today.setHours(
        0,
        0,
        0,
        0
      )


      /* =====================================================
         STEP 1
         检查库存
      ===================================================== */

      for (
        const ingredient of
        ingredientsToUse
      ) {

        const recipeIngredientId =
          normalizeIngredientId(
            ingredient
              .ingredient_id ??
            ingredient
              .ingredientId
          )


        const amountNeeded =
          Number(
            ingredient.quantity
          )


        const validBatches =
          nextFridgeItems.filter(
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
                兼容旧 localStorage：
                没有 ID 时用名称匹配
              */

              const sameName =
                !fridgeIngredientId &&
                item.name ===
                  ingredient.name


              if (
                !sameId &&
                !sameName
              ) {
                return false
              }


              const expiry =
                new Date(
                  item.expiryDate
                )


              expiry.setHours(
                0,
                0,
                0,
                0
              )


              /*
                已过期库存不能使用
              */

              if (
                expiry < today
              ) {
                return false
              }


              return true
            }
          )


        /* =====================
           Completely Missing
        ===================== */

        if (
          validBatches.length ===
          0
        ) {

          window.alert(
            `${ingredient.name}库存不足，请先检查冰箱库存。`
          )

          return false
        }


        /* =====================
           Unknown Quantity
        ===================== */

        const hasUnknownQuantity =
          validBatches.some(
            (item) =>

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


        /*
          数量未知时：

          RecipeDetail 已经让用户选择
          「还有」或「用完了」。

          所以这里不用做数量不足判断。
        */

        if (
          hasUnknownQuantity
        ) {
          continue
        }


        /*
          菜谱数量不是数字时，
          不做数量校验。
        */

        if (
          !Number.isFinite(
            amountNeeded
          )
        ) {
          continue
        }


        /* =====================
           Unit Match
        ===================== */

        const numericBatches =
          validBatches.filter(
            (item) =>
              item.unit ===
                ingredient.unit
          )


        const totalAvailable =
          numericBatches.reduce(
            (
              total,
              batch
            ) =>

              total +
              Number(
                batch.quantity
              ),

            0
          )


        if (
          totalAvailable <
          amountNeeded
        ) {

          window.alert(
            `${ingredient.name}库存不足，请先检查冰箱库存。`
          )

          return false
        }
      }


      /* =====================================================
         STEP 2
         扣除库存
      ===================================================== */

      ingredientsToUse.forEach(
        (ingredient) => {

          const recipeIngredientId =
            normalizeIngredientId(
              ingredient
                .ingredient_id ??
              ingredient
                .ingredientId
            )


          let amountNeeded =
            Number(
              ingredient.quantity
            )


          /* =====================
             Find Valid Batches
          ===================== */

          const allValidBatches =
            nextFridgeItems.filter(
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
                  item.name ===
                    ingredient.name


                if (
                  !sameId &&
                  !sameName
                ) {
                  return false
                }


                const expiry =
                  new Date(
                    item.expiryDate
                  )


                expiry.setHours(
                  0,
                  0,
                  0,
                  0
                )


                return (
                  expiry >= today
                )
              }
            )


          /* =====================
             Unknown Quantity
          ===================== */

          const hasUnknownQuantity =
            allValidBatches.some(
              (item) =>

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


          if (
            hasUnknownQuantity
          ) {

            /*
              这个 key 必须和
              RecipeDetail.jsx 完全一致
            */

            const decisionKey =
              recipeIngredientId ||
              `name:${ingredient.name}`


            const decision =
              unknownDecisions[
                decisionKey
              ]


            /* =====================
               User chose:
               用完了
            ===================== */

            if (
              decision ===
              'usedUp'
            ) {

              /*
                用户明确表示使用后已经没有剩余，
                所以把这个食材的有效库存批次删除。
              */

              allValidBatches.forEach(
                (item) => {

                  unknownItemsToRemove.add(
                    item.id
                  )
                }
              )
            }


            /* =====================
               User chose:
               还有

               无法知道具体剩余数量，
               所以保留库存，不乱扣数字。
            ===================== */

            return
          }


          /* =====================
             Normal Numeric Stock
          ===================== */

          if (
            !Number.isFinite(
              amountNeeded
            )
          ) {
            return
          }


          /*
            FEFO：
            First Expired,
            First Out

            最早过期的先扣。
          */

          const batches =
            allValidBatches

              .filter(
                (item) =>
                  item.unit ===
                    ingredient.unit
              )

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
              )


          batches.forEach(
            (batch) => {

              if (
                amountNeeded <=
                0
              ) {
                return
              }


              const index =
                nextFridgeItems
                  .findIndex(
                    (item) =>
                      item.id ===
                      batch.id
                  )


              if (
                index === -1
              ) {
                return
              }


              const available =
                Number(
                  nextFridgeItems[
                    index
                  ].quantity
                )


              const used =
                Math.min(
                  available,
                  amountNeeded
                )


              nextFridgeItems[
                index
              ].quantity =
                available -
                used


              amountNeeded -=
                used
            }
          )
        }
      )


      /* =====================================================
         STEP 3
         清理库存
      ===================================================== */

      const remainingItems =
        nextFridgeItems.filter(
          (item) => {


            /* =====================
               用户选择「用完了」
            ===================== */

            if (
              unknownItemsToRemove.has(
                item.id
              )
            ) {
              return false
            }


            /* =====================
               数量未知但用户说「还有」
               → 保留
            ===================== */

            if (
              item.quantity ===
                null ||

              item.quantity ===
                undefined ||

              item.quantity ===
                ''
            ) {
              return true
            }


            if (
              !Number.isFinite(
                Number(
                  item.quantity
                )
              )
            ) {
              return true
            }


            /* =====================
               数量扣到 0
               → 删除
            ===================== */

            return (
              Number(
                item.quantity
              ) > 0
            )
          }
        )


      /* =====================================================
         STEP 4
         Update Fridge
      ===================================================== */

      setFridgeItems(
        remainingItems
      )

      showToast(
  '库存已更新'
)

      return true
    }


  /* =========================================================
     RECIPE NAVIGATION
  ========================================================= */

  const openRecipeDetail =
    (
      recipe
    ) => {

      setSelectedRecipe(
        recipe
      )


      setCurrentPage(
        'recipeDetail'
      )
    }


  const closeRecipeDetail =
    () => {

      setCurrentPage(
        'recipes'
      )
    }


  /* =========================================================
     ROUTER
  ========================================================= */

  const renderPage =
    () => {

      switch (
        currentPage
      ) {


        /* =====================================================
           HOME
        ===================================================== */

        case 'home':

          return (

            <Home

              fridgeItems={
                fridgeItems
              }

              onOpenRecipe={
                openRecipeDetail
              }

              onNavigate={
                setCurrentPage
              }

            />
          )


        /* =====================================================
           FRIDGE
        ===================================================== */

        case 'fridge':

          return (

            <Fridge

              items={
                fridgeItems
              }

              setItems={
                setFridgeItems
              }

              onOpenAdd={
                openFridgeAdd
              }

              onOpenEdit={
                openFridgeEdit
              }

              onToast={
                showToast
              }

            />
          )


        /* =====================================================
           FRIDGE ADD
        ===================================================== */

        case 'fridgeAdd':

          return (

            <FridgeAdd

              presetIngredientId={
                fridgeAddPreset
              }

              onAdd={
                addFridgeItem
              }

              onOpenScan={
                openReceiptScan
              }

              onOpenBrowse={
                () =>
                  setCurrentPage(
                    'fridgeBrowse'
                  )
              }

              onCancel={
                () => {

                  setFridgeAddPreset(
                    null
                  )

                  setCurrentPage(
                    'fridge'
                  )
                }
              }

            />
          )


        /* =====================================================
           FRIDGE BROWSE
        ===================================================== */

        case 'fridgeBrowse':

          return (

            <FridgeBrowse

              onCancel={
                () =>
                  setCurrentPage(
                    'fridge'
                  )
              }

              onOpenScan={
                openReceiptScan
              }

              onOpenQuickAdd={
                () => {

                  setFridgeAddPreset(
                    null
                  )

                  setCurrentPage(
                    'fridgeAdd'
                  )
                }
              }

              onAddAll={
                (
                  newItems
                ) =>
                  addMultipleFridgeItems(
                    newItems
                  )
              }

            />
          )


        /* =====================================================
           RECEIPT SCAN
        ===================================================== */

        case 'fridgeReceiptScan':

          return (

            <FridgeReceiptScan

              onCancel={
                () => {

                  setCapturedReceiptImage(
                    null
                  )

                  setReceiptResultItems(
                    []
                  )

                  setCurrentPage(
                    'fridge'
                  )
                }
              }

              onOpenBrowse={
                () => {

                  setCapturedReceiptImage(
                    null
                  )

                  setReceiptResultItems(
                    []
                  )

                  setCurrentPage(
                    'fridgeBrowse'
                  )
                }
              }

              onOpenQuickAdd={
                () => {

                  setCapturedReceiptImage(
                    null
                  )

                  setReceiptResultItems(
                    []
                  )

                  setFridgeAddPreset(
                    null
                  )

                  setCurrentPage(
                    'fridgeAdd'
                  )
                }
              }

              onCaptureDone={
                handleReceiptCapture
              }

            />
          )


        /* =====================================================
           RECEIPT RESULT
        ===================================================== */

        case 'fridgeReceiptResult':

          return (

            <FridgeReceiptResult

              initialItems={
                receiptResultItems
              }

              onCancel={
                () => {

                  setReceiptResultItems(
                    []
                  )

                  setCapturedReceiptImage(
                    null
                  )

                  setCurrentPage(
                    'fridge'
                  )
                }
              }

              onOpenScan={
                openReceiptScan
              }

              onOpenBrowse={
                () => {

                  setReceiptResultItems(
                    []
                  )

                  setCapturedReceiptImage(
                    null
                  )

                  setCurrentPage(
                    'fridgeBrowse'
                  )
                }
              }

              onOpenQuickAdd={
                () => {

                  setReceiptResultItems(
                    []
                  )

                  setCapturedReceiptImage(
                    null
                  )

                  setFridgeAddPreset(
                    null
                  )

                  setCurrentPage(
                    'fridgeAdd'
                  )
                }
              }

              onAddAll={
                addReceiptItemsToFridge
              }

            />
          )


        /* =====================================================
           FRIDGE EDIT
        ===================================================== */

        case 'fridgeEdit':

          return (

            <FridgeEdit

              item={
                selectedFridgeItem
              }

              onCancel={
                () => {

                  setSelectedFridgeItem(
                    null
                  )

                  setCurrentPage(
                    'fridge'
                  )
                }
              }

              onConfirm={
                updateFridgeItem
              }

            />
          )


        /* =====================================================
           RECIPES
        ===================================================== */

        case 'recipes':

          return (

            <Recipes

              fridgeItems={
                fridgeItems
              }

              onOpenRecipe={
                openRecipeDetail
              }

            />
          )


        /* =====================================================
           SHOPPING LIST
        ===================================================== */

        case 'list':

          return (

            <ShoppingList

              items={
                shoppingItems
              }

              setItems={
                setShoppingItems
              }

              shoppingUsage={
                shoppingUsage
              }

              onAddShoppingItem={
                addShoppingItem
              }

              onOpenQuickAdd={
                () =>
                  setCurrentPage(
                    'shoppingAdd'
                  )
              }

              onAddToFridge={
                addPurchasedToFridge
              }

              onToast={
    showToast
  }

            />
          )


        /* =====================================================
           SHOPPING ADD
        ===================================================== */

        case 'shoppingAdd':

          return (

            <ShoppingAdd

              onAddShoppingItem={
                addShoppingItem
              }

              onBack={
                () =>
                  setCurrentPage(
                    'list'
                  )
              }

            />
          )


        /* =====================================================
           RECIPE DETAIL
        ===================================================== */

        case 'recipeDetail':

          return (

            <RecipeDetail

              recipe={
                selectedRecipe
              }

              fridgeItems={
                fridgeItems
              }

              shoppingItems={
                shoppingItems
              }

              onAddToShoppingList={
                addToShoppingList
              }

              onFinishCooking={
                finishCooking
              }

              onBack={
                closeRecipeDetail
              }

            />
          )


        /* =====================================================
           DEFAULT
        ===================================================== */

        default:

          return (

            <Home

              fridgeItems={
                fridgeItems
              }

              onOpenRecipe={
                openRecipeDetail
              }

              onNavigate={
                setCurrentPage
              }

            />
          )
      }
    }


  /* =========================================================
     HIDE BOTTOM NAV
  ========================================================= */

  const hideBottomNav =

    currentPage ===
      'recipeDetail' ||

    currentPage ===
      'shoppingAdd' ||

    currentPage ===
      'fridgeAdd' ||

    currentPage ===
      'fridgeBrowse' ||

    currentPage ===
      'fridgeEdit' ||

    currentPage ===
      'fridgeReceiptScan' ||

    currentPage ===
      'fridgeReceiptResult'


  /* =========================================================
     APP
  ========================================================= */

return (

  <>

    {renderPage()}


    {!hideBottomNav && (

      <BottomNav

        activePage={
          currentPage
        }

        onNavigate={
          setCurrentPage
        }

      />

    )}


    <Toast

      message={
        toast.message
      }

      visible={
        Boolean(
          toast.message
        )
      }

    />

  </>
)
}


export default App
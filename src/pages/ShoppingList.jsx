import {
  useMemo,
  useState,
} from 'react'

import ingredients from '../data/ingredients'

import ConfirmModal from '../components/ConfirmModal'

import './ShoppingList.css'


/* =========================
   Default Shortcuts
========================= */

const defaultShortcutIds = [
  '003', // 鸡蛋
  '004', // 牛奶
  '001', // 土豆
]


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


/* =========================
   Find Master Ingredient
========================= */

function findMasterIngredient({
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


/* =========================
   Component
========================= */

function ShoppingList({

  items,

  setItems,

  shoppingUsage = {},

  onAddShoppingItem,

  onOpenQuickAdd,

  onAddToFridge,

  onToast,

}) {


  const [
    search,
    setSearch,
  ] = useState(
    ''
  )


  const [
    showClearConfirm,
    setShowClearConfirm,
  ] = useState(
    false
  )


  /* =========================
     Search Results
  ========================= */

  const searchResults =
    useMemo(
      () => {

        const keyword =
          search.trim()


        if (
          !keyword
        ) {
          return []
        }


        return ingredients
          .filter(
            (ingredient) => {

              const matchesName =
                ingredient.name.includes(
                  keyword
                )


              const matchesKeyword =
                ingredient
                  .keywords
                  ?.some(
                    (item) =>
                      item.includes(
                        keyword
                      )
                  )


              return (
                matchesName ||
                matchesKeyword
              )
            }
          )
          .slice(
            0,
            5
          )

      },
      [
        search,
      ]
    )


  /* =========================
     Shortcuts
  ========================= */

  const shortcuts =
    useMemo(
      () => {


        /* =====================
           Default Shortcuts

           鸡蛋 / 牛奶 / 土豆
        ===================== */

        const defaults =
          defaultShortcutIds
            .map(
              (id) => {

                const ingredient =
                  ingredients.find(
                    (item) =>
                      normalizeIngredientId(
                        item.ingredient_id
                      ) ===
                      normalizeIngredientId(
                        id
                      )
                  )


                if (
                  !ingredient
                ) {
                  return null
                }


                return {

                  ingredientId:
                    ingredient
                      .ingredient_id,

                  name:
                    ingredient.name,

                  unit:
                    ingredient
                      .default_unit ||
                    '个',

                  count:
                    Number.POSITIVE_INFINITY,

                }
              }
            )
            .filter(
              Boolean
            )


        /* =====================
           Frequent Shortcuts

           添加超过 5 次
           自动进入 shortcut
        ===================== */

        const frequent =
          Object.values(
            shoppingUsage
          )

            .filter(
              (item) =>
                Number(
                  item.count
                ) > 5
            )

            .map(
              (item) => {

                const master =
                  findMasterIngredient({

                    ingredientId:
                      item.ingredientId ??
                      item.ingredient_id,

                    name:
                      item.name,

                  })


                return {

                  ingredientId:
                    master
                      ?.ingredient_id ||
                    item
                      .ingredientId ||
                    item
                      .ingredient_id ||
                    null,

                  name:
                    master?.name ||
                    item.name,

                  unit:
                    item.unit ||
                    master
                      ?.default_unit ||
                    '个',

                  count:
                    Number(
                      item.count
                    ) || 0,

                }
              }
            )

            /*
              默认三个不要重复出现
            */

            .filter(
              (item) => {

                const id =
                  normalizeIngredientId(
                    item.ingredientId
                  )


                const isDefaultId =
                  defaultShortcutIds.some(
                    (defaultId) =>
                      normalizeIngredientId(
                        defaultId
                      ) === id
                  )


                const isDefaultName =
                  defaults.some(
                    (defaultItem) =>
                      defaultItem.name ===
                      item.name
                  )


                return (
                  !isDefaultId &&
                  !isDefaultName
                )
              }
            )

            .sort(
              (
                a,
                b
              ) =>
                b.count -
                a.count
            )


        /* =====================
           Remove Duplicates
        ===================== */

        const combined = [
          ...defaults,
          ...frequent,
        ]


        const unique = []


        combined.forEach(
          (shortcut) => {

            const key =
              shortcut.ingredientId

                ? `id:${normalizeIngredientId(
                    shortcut.ingredientId
                  )}`

                : `name:${shortcut.name}`


            const exists =
              unique.some(
                (item) =>
                  item.key === key
              )


            if (
              !exists
            ) {

              unique.push({
                ...shortcut,
                key,
              })
            }
          }
        )


        /*
          最多 5 个 shortcuts
        */

        return unique.slice(
          0,
          5
        )

      },
      [
        shoppingUsage,
      ]
    )


  /* =========================
     Filter Existing List
  ========================= */

  const filteredItems =
    useMemo(
      () => {

        const keyword =
          search.trim()


        if (
          !keyword
        ) {
          return items
        }


        return items.filter(
          (item) =>
            item.name.includes(
              keyword
            )
        )

      },
      [
        items,
        search,
      ]
    )


  /* =========================
     Pending / Purchased
  ========================= */

  const pendingItems =
    filteredItems.filter(
      (item) =>
        !item.purchased
    )


  const purchasedItems =
    filteredItems.filter(
      (item) =>
        item.purchased
    )


  const totalPurchasedCount =
    items.filter(
      (item) =>
        item.purchased
    ).length


  /* =========================
     Toggle Purchased
  ========================= */

  const togglePurchased =
    (
      id
    ) => {

      setItems(
        (
          currentItems
        ) =>

          currentItems.map(
            (item) =>

              item.id === id

                ? {
                    ...item,

                    purchased:
                      !item.purchased,
                  }

                : item
          )
      )
    }


  /* =========================
     Shortcut Add
  ========================= */

  const addShortcut =
    (
      shortcut
    ) => {

      onAddShoppingItem({

        ingredientId:
          shortcut
            .ingredientId,

        name:
          shortcut.name,

        quantity:
          1,

        unit:
          shortcut.unit ||
          '个',

        source:
          null,

        note:
          null,

      })
    }


  /* =========================
     Search Result Add
  ========================= */

  const addSearchResult =
    (
      ingredient
    ) => {

      onAddShoppingItem({

        ingredientId:
          ingredient
            .ingredient_id,

        name:
          ingredient.name,

        quantity:
          1,

        unit:
          ingredient
            .default_unit ||
          '个',

        source:
          null,

        note:
          null,

      })


      setSearch(
        ''
      )
    }


  /* =========================
     Custom Search Add
  ========================= */

  const addCustomSearch =
    () => {

      const name =
        search.trim()


      if (
        !name
      ) {
        return
      }


      onAddShoppingItem({

        ingredientId:
          null,

        name,

        quantity:
          1,

        unit:
          '个',

        source:
          null,

        note:
          null,

      })


      setSearch(
        ''
      )
    }


  /* =========================
     Clear Confirm
  ========================= */

  const confirmClear =
    () => {

      setItems(
        []
      )


      setShowClearConfirm(
        false
      )


      onToast?.(
        '采购清单已清空'
      )
    }


  /* =========================
     Render
  ========================= */

  return (

    <div className="shopping-app">

      <main className="shopping-page">


        {/* =====================
            Header
        ===================== */}

        <header className="shopping-header">


          <h1>
            采购清单
          </h1>


          <button

            className="shopping-clear"

            type="button"

            onClick={
              () =>
                setShowClearConfirm(
                  true
                )
            }

          >
            清空
          </button>

        </header>


        {/* =====================
            Search
        ===================== */}

        <div className="shopping-search-area">


          <div className="shopping-search">

            <img

              src="/images/icons/icon-search-bar.png"

              alt=""

            />


            <input

              type="text"

              value={
                search
              }

              placeholder="搜索食材"

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


          {/* =====================
              Search Suggestions
          ===================== */}

          {
            search.trim() && (

              <div className="shopping-search-results">


                {/* Existing Ingredients */}

                {
                  searchResults.map(
                    (
                      ingredient
                    ) => (

                      <button

                        key={
                          ingredient
                            .ingredient_id
                        }

                        type="button"

                        className="shopping-search-result"

                        onClick={
                          () =>
                            addSearchResult(
                              ingredient
                            )
                        }

                      >

                        <span>
                          {ingredient.name}
                        </span>


                        <span className="shopping-search-add">
                          ＋ 添加
                        </span>

                      </button>

                    )
                  )
                }


                {/* Custom Ingredient */}

                {
                  !searchResults.some(
                    (ingredient) =>
                      ingredient.name ===
                      search.trim()
                  ) && (

                    <button

                      className="shopping-search-result custom"

                      type="button"

                      onClick={
                        addCustomSearch
                      }

                    >

                      <span>

                        添加「
                        {search.trim()}
                        」

                      </span>


                      <span className="shopping-search-add">
                        ＋
                      </span>

                    </button>

                  )
                }

              </div>

            )
          }

        </div>


        {/* =====================
            Quick Add
        ===================== */}

        <section className="shopping-quick-add">


          {/* Manual Add */}

          <button

            className="shopping-quick-main"

            type="button"

            onClick={
              onOpenQuickAdd
            }

          >

            <img

              src="/images/icons/icon-add-green.png"

              alt=""

            />

            快速添加

          </button>


          {/* =====================
              Shortcuts
          ===================== */}

          {
            shortcuts.map(
              (
                shortcut
              ) => (

                <button

                  className="shopping-chip"

                  type="button"

                  key={
                    shortcut.key
                  }

                  onClick={
                    () =>
                      addShortcut(
                        shortcut
                      )
                  }

                >

                  {shortcut.name}

                </button>

              )
            )
          }

        </section>


        {/* =====================
            Pending
        ===================== */}

        <section className="shopping-section">


          <h2>
            待购买 ({pendingItems.length})
          </h2>


          <div className="shopping-card">


            {
              pendingItems.length >
              0 ? (

                pendingItems.map(
                  (
                    item
                  ) => (

                    <div

                      className="shopping-item"

                      key={
                        item.id
                      }

                    >


                      {/* Checkbox */}

                      <button

                        className="shopping-check pending"

                        type="button"

                        aria-label={`标记${item.name}为已购买`}

                        onClick={
                          () =>
                            togglePurchased(
                              item.id
                            )
                        }

                      />


                      {/* Main */}

                      <div className="shopping-item-main">


                        <div className="shopping-name-row">


                          <span className="shopping-name">

                            {item.name}

                          </span>


                          {/* Recipe Source */}

                          {
                            item.source && (

                              <span className="shopping-source">

                                <img

                                  src="/images/icons/icon-warning.png"

                                  alt=""

                                />

                                来自 {item.source}

                              </span>

                            )
                          }

                        </div>


                        {/* Note */}

                        {
                          item.note && (

                            <span className="shopping-note">

                              {item.note}

                            </span>

                          )
                        }

                      </div>


                      {/* Quantity */}

                      <span className="shopping-quantity">

                        {item.quantity}{' '}
                        {item.unit}

                      </span>

                    </div>

                  )
                )

              ) : (

                <div className="shopping-empty-row">

                  暂无待购买食材

                </div>

              )
            }

          </div>

        </section>


        {/* =====================
            Purchased
        ===================== */}

        <section className="shopping-section purchased-section">


          <h2>
            已购买 ({purchasedItems.length})
          </h2>


          <div className="shopping-card">


            {
              purchasedItems.length >
              0 ? (

                purchasedItems.map(
                  (
                    item
                  ) => (

                    <div

                      className="shopping-item purchased-item"

                      key={
                        item.id
                      }

                    >


                      {/* Checkbox */}

                      <button

                        className="shopping-check purchased"

                        type="button"

                        aria-label={`取消${item.name}已购买状态`}

                        onClick={
                          () =>
                            togglePurchased(
                              item.id
                            )
                        }

                      >

                        <img

                          src="/images/icons/icon-check-mark.png"

                          alt=""

                        />

                      </button>


                      {/* Main */}

                      <div className="shopping-item-main">


                        <span className="shopping-name">

                          {item.name}

                        </span>


                        {/* Note */}

                        {
                          item.note && (

                            <span className="shopping-note">

                              {item.note}

                            </span>

                          )
                        }

                      </div>


                      {/* Quantity */}

                      <span className="shopping-quantity">

                        {item.quantity}{' '}
                        {item.unit}

                      </span>

                    </div>

                  )
                )

              ) : (

                <div className="shopping-empty-row">

                  暂无已购买食材

                </div>

              )
            }

          </div>

        </section>


        {/* =====================
            Add To Fridge
        ===================== */}

        <button

          className="add-to-fridge-button"

          type="button"

          disabled={
            totalPurchasedCount ===
            0
          }

          onClick={
            onAddToFridge
          }

        >

          加入冰箱

          <span>
            →
          </span>

        </button>

      </main>


      {/* =====================
          Clear Confirm Modal
      ===================== */}

      {
        showClearConfirm && (

          <ConfirmModal

            message="确认清空购物清单吗？"

            onCancel={
              () =>
                setShowClearConfirm(
                  false
                )
            }

            onConfirm={
              confirmClear
            }

          />

        )
      }

    </div>
  )
}


export default ShoppingList
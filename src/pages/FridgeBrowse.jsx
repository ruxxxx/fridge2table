import { useMemo, useState } from 'react'

import ingredients from '../data/ingredients'

import './FridgeBrowse.css'


/* =========================
   Master Ingredient Items
========================= */

const masterBrowseItems = ingredients.map(
  (ingredient) => {

    /*
      ingredients.js 里有一个“蔬菜”分类，
      浏览页统一归到“果蔬”Tab
    */
    const displayCategory =
      ingredient.category === '蔬菜'
        ? '果蔬'
        : ingredient.category


    return {
      browseId:
        `ingredient-${ingredient.ingredient_id}`,

      ingredientId:
        ingredient.ingredient_id,

      name:
        ingredient.name,

      category:
        displayCategory,

      group:
        ingredient.group || displayCategory,

      image:
        ingredient.image,

      defaultUnit:
        ingredient.default_unit,

      defaultExpiryDays:
        ingredient.default_shelf_life,

      keywords:
        ingredient.keywords || [],
    }
  }
)


const browseItems =
  masterBrowseItems


const categories = [
  '肉类',
  '海鲜',
  '果蔬',
  '乳制品',
]


/* =========================
   Group Order
========================= */

const groupOrder = {
  猪肉: 1,
  牛肉: 2,
  鸡肉: 3,
  羊肉: 4,
}


/* =========================
   Date
========================= */

function getTodayString() {

  const today =
    new Date()


  const year =
    today.getFullYear()


  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      '0'
    )


  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      '0'
    )


  return `${year}-${month}-${day}`
}


/* =========================
   Quantity Parser
========================= */

function parseQuantityText(
  value,
  fallbackUnit
) {

  const text =
    value.trim()


  /* Quantity can be empty */

  if (!text) {

    return {
      quantity: null,
      unit: fallbackUnit,
    }
  }


  const match =
    text.match(
      /^(\d+(?:\.\d+)?)\s*(.*)$/
    )


  if (!match) {

    return {
      quantity: null,
      unit: fallbackUnit,
    }
  }


  return {
    quantity:
      Number(
        match[1]
      ),

    unit:
      match[2].trim() ||
      fallbackUnit,
  }
}


/* =========================
   Component
========================= */

function FridgeBrowse({
  onCancel,
  onAddAll,
  onOpenQuickAdd,
  onOpenScan,
}) {

  const [
    mode,
    setMode,
  ] = useState(
    'browse'
  )


  const [
    search,
    setSearch,
  ] = useState(
    ''
  )


  const [
    activeCategory,
    setActiveCategory,
  ] = useState(
    '肉类'
  )


  const [
    selectedIds,
    setSelectedIds,
  ] = useState(
    []
  )


  const [
    activeEditId,
    setActiveEditId,
  ] = useState(
    null
  )


  const [
    editData,
    setEditData,
  ] = useState(
    {}
  )


  /* =========================
     Visible Items
  ========================= */

  const filteredItems =
    useMemo(
      () => {

        const keyword =
          search
            .trim()
            .toLowerCase()


        return browseItems.filter(
          (item) => {

            const matchesCategory =
              item.category ===
              activeCategory


            const matchesName =
              item.name
                .toLowerCase()
                .includes(
                  keyword
                )


            const matchesKeywords =
              item.keywords.some(
                (itemKeyword) =>
                  String(
                    itemKeyword
                  )
                    .toLowerCase()
                    .includes(
                      keyword
                    )
              )


            const matchesSearch =
              keyword === '' ||
              matchesName ||
              matchesKeywords


            return (
              matchesCategory &&
              matchesSearch
            )
          }
        )
      },
      [
        search,
        activeCategory,
      ]
    )


  /* =========================
     Selected Items
  ========================= */

  const selectedItems =
    useMemo(
      () => {

        return selectedIds
          .map(
            (id) =>
              browseItems.find(
                (item) =>
                  item.browseId ===
                  id
              )
          )
          .filter(
            Boolean
          )
      },
      [
        selectedIds,
      ]
    )


  /* =========================
     Toggle Selection
  ========================= */

  const toggleSelected =
    (browseId) => {

      setSelectedIds(
        (current) => {

          if (
            current.includes(
              browseId
            )
          ) {

            return current.filter(
              (id) =>
                id !== browseId
            )
          }


          return [
            ...current,
            browseId,
          ]
        }
      )
    }


  /* =========================
     Open Edit
  ========================= */

  const openEdit = () => {

    if (
      selectedItems.length ===
      0
    ) {
      return
    }


    const today =
      getTodayString()


    const initialEditData =
      {}


    selectedItems.forEach(
      (item) => {

        initialEditData[
          item.browseId
        ] = {

          quantityText:
            '',

          purchaseDate:
            today,

          shelfLife:
            item.defaultExpiryDays,
        }
      }
    )


    setEditData(
      initialEditData
    )


    setActiveEditId(
      selectedItems[0]
        .browseId
    )


    setMode(
      'edit'
    )
  }


  /* =========================
     Update Edit Field
  ========================= */

  const updateEditField =
    (
      browseId,
      field,
      value
    ) => {

      setEditData(
        (current) => ({
          ...current,

          [browseId]: {
            ...current[
              browseId
            ],

            [field]:
              value,
          },
        })
      )
    }


  /* =========================
     Can Submit
  ========================= */

  const canSubmit =
    selectedItems.length >
    0


  /* =========================
     Add All
  ========================= */

  const handleAddAll = () => {

    if (!canSubmit) {
      return
    }


    const newItems =
      selectedItems.map(
        (item) => {

          const form =
            editData[
              item.browseId
            ]


          const parsedQuantity =
            parseQuantityText(
              form.quantityText,
              item.defaultUnit
            )


          const addedDate =
            new Date(
              `${form.purchaseDate}T00:00:00`
            )


          const expiryDate =
            new Date(
              addedDate
            )


          expiryDate.setDate(
            expiryDate.getDate() +
            Number(
              form.shelfLife ||
              0
            )
          )


          return {
            ingredientId:
              item.ingredientId,

            name:
              item.name,

            category:
              item.category,

            quantity:
              parsedQuantity.quantity,

            unit:
              parsedQuantity.unit,

            image:
              item.image,

            addedDate,

            expiryDate,
          }
        }
      )


    onAddAll(
      newItems
    )
  }


  /* =========================
     Browse Mode
  ========================= */

  if (
    mode === 'browse'
  ) {

    const groupedItems =
      filteredItems.reduce(
        (
          groups,
          item
        ) => {

          const groupName =
            item.group ||
            item.category


          if (
            !groups[
              groupName
            ]
          ) {

            groups[
              groupName
            ] = []
          }


          groups[
            groupName
          ].push(
            item
          )


          return groups
        },
        {}
      )


    const sortedGroups =
      Object.entries(
        groupedItems
      ).sort(
        (
          [groupA],
          [groupB]
        ) => {

          const orderA =
            groupOrder[
              groupA
            ] || 999


          const orderB =
            groupOrder[
              groupB
            ] || 999


          if (
            orderA !==
            orderB
          ) {

            return (
              orderA -
              orderB
            )
          }


          return groupA.localeCompare(
            groupB,
            'zh-CN'
          )
        }
      )


    return (
      <div className="fridge-browse-app">

        <main className="fridge-browse-page">


          {/* =====================
              Header
          ===================== */}

          <header className="fridge-browse-header">

            <h1>
              添加食材
            </h1>

            <p>
              选择添加食材的方式
            </p>

          </header>


          {/* =====================
              Methods
          ===================== */}

          <section className="fridge-browse-methods">


            {/* Receipt */}

            <button
              className="fridge-browse-method"
              type="button"
              onClick={
                onOpenScan
              }
            >

              <img
                src="/images/icons/icon-scan.png"
                alt=""
              />

              <span>
                小票识别
              </span>

            </button>


            {/* Browse Active */}

            <button
              className="fridge-browse-method active"
              type="button"
            >

              <img
                src="/images/icons/icon-search.png"
                alt=""
              />

              <span>
                浏览添加
              </span>

            </button>


            {/* Quick Add */}

            <button
              className="fridge-browse-method"
              type="button"
              onClick={
                onOpenQuickAdd
              }
            >

              <img
                src="/images/icons/icon-writing.png"
                alt=""
              />

              <span>
                快速添加
              </span>

            </button>

          </section>


          {/* =====================
              Browse Card
          ===================== */}

          <section className="browse-food-card">


            {/* Search */}

            <div className="browse-food-search">

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
                  (event) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                }
              />

            </div>


            {/* Categories */}

            <div className="browse-food-categories">

              {categories.map(
                (category) => (

                  <button
                    key={
                      category
                    }
                    type="button"
                    className={
                      activeCategory ===
                      category
                        ? 'active'
                        : ''
                    }
                    onClick={
                      () => {

                        setActiveCategory(
                          category
                        )

                        setSearch(
                          ''
                        )
                      }
                    }
                  >
                    {category}
                  </button>

                )
              )}

            </div>


            {/* Food Groups */}

            <div className="browse-food-groups">

              {sortedGroups.length >
              0 ? (

                sortedGroups.map(
                  (
                    [
                      groupName,
                      groupItems,
                    ]
                  ) => (

                    <section
                      className="browse-food-group"
                      key={
                        groupName
                      }
                    >

                      <h2>
                        {groupName}
                      </h2>


                      <div className="browse-food-grid">

                        {groupItems.map(
                          (item) => {

                            const selected =
                              selectedIds.includes(
                                item.browseId
                              )


                            return (

                              <button
                                className={`browse-food-item ${
                                  selected
                                    ? 'selected'
                                    : ''
                                }`}
                                key={
                                  item.browseId
                                }
                                type="button"
                                onClick={
                                  () =>
                                    toggleSelected(
                                      item.browseId
                                    )
                                }
                              >


                                {/* Image */}

                                <div className="browse-food-image-wrap">

                                  <img
                                    src={
                                      item.image
                                    }
                                    alt={
                                      item.name
                                    }
                                  />


                                  {/* Selected Feedback */}

                                  {selected && (

                                    <span className="browse-selected-circle">
                                      ✓
                                    </span>

                                  )}

                                </div>


                                {/* Name */}

                                <span className="browse-food-name">

                                  {item.name}

                                </span>

                              </button>

                            )
                          }
                        )}

                      </div>

                    </section>

                  )
                )

              ) : (

                <div className="browse-food-empty">
                  没有找到相关食材
                </div>

              )}

            </div>

          </section>


          {/* =====================
              Fixed Bottom Actions
          ===================== */}

          <div className="browse-bottom-actions">

            <button
              className="browse-cancel"
              type="button"
              onClick={
                onCancel
              }
            >
              取消加入
            </button>


            <button
              className="browse-selected-button"
              type="button"
              disabled={
                selectedItems.length ===
                0
              }
              onClick={
                openEdit
              }
            >
              已选择 (
              {selectedItems.length}
              )
            </button>

          </div>

        </main>

      </div>
    )
  }


  /* =========================
     Edit Mode
  ========================= */

  const activeItem =
    selectedItems.find(
      (item) =>
        item.browseId ===
        activeEditId
    )


  const activeForm =
    activeItem
      ? editData[
          activeItem.browseId
        ]
      : null


  return (
    <div className="fridge-browse-app">

      <main className="fridge-browse-page">


        {/* =====================
            Header
        ===================== */}

        <header className="fridge-browse-header">

          <h1>
            添加食材
          </h1>

          <p>
            选择添加食材的方式
          </p>

        </header>


        {/* =====================
            Methods
        ===================== */}

        <section className="fridge-browse-methods">


          {/* Receipt */}

          <button
            className="fridge-browse-method"
            type="button"
            onClick={
              onOpenScan
            }
          >

            <img
              src="/images/icons/icon-scan.png"
              alt=""
            />

            <span>
              小票识别
            </span>

          </button>


          {/* Browse Active */}

          <button
            className="fridge-browse-method active"
            type="button"
          >

            <img
              src="/images/icons/icon-search.png"
              alt=""
            />

            <span>
              浏览添加
            </span>

          </button>


          {/* Quick Add */}

          <button
            className="fridge-browse-method"
            type="button"
            onClick={
              onOpenQuickAdd
            }
          >

            <img
              src="/images/icons/icon-writing.png"
              alt=""
            />

            <span>
              快速添加
            </span>

          </button>

        </section>


        {/* =====================
            Edit Card
        ===================== */}

        <section className="browse-edit-card">

          <h2>
            食材信息
          </h2>


          {/* Selected Tabs */}

          <div className="browse-edit-tabs">

            {selectedItems.map(
              (item) => (

                <button
                  key={
                    item.browseId
                  }
                  type="button"
                  className={
                    activeEditId ===
                    item.browseId
                      ? 'active'
                      : ''
                  }
                  onClick={
                    () =>
                      setActiveEditId(
                        item.browseId
                      )
                  }
                >
                  {item.name}
                </button>

              )
            )}

          </div>


          {activeItem &&
            activeForm && (
              <>


                {/* Name */}

                <label className="browse-edit-field">

                  <span>
                    食材名称
                  </span>

                  <input
                    value={
                      activeItem.name
                    }
                    readOnly
                  />

                </label>


                {/* Quantity */}

                <label className="browse-edit-field">

                  <span>
                    数量
                  </span>

                  <input
                    type="text"
                    value={
                      activeForm
                        .quantityText
                    }
                    placeholder={`例：500${activeItem.defaultUnit}`}
                    onChange={
                      (event) =>
                        updateEditField(
                          activeItem
                            .browseId,

                          'quantityText',

                          event
                            .target
                            .value
                        )
                    }
                  />

                </label>


                {/* Purchase Date */}

                <label className="browse-edit-field">

                  <span>
                    购买日期
                  </span>

                  <input
                    type="date"
                    value={
                      activeForm
                        .purchaseDate
                    }
                    onChange={
                      (event) =>
                        updateEditField(
                          activeItem
                            .browseId,

                          'purchaseDate',

                          event
                            .target
                            .value
                        )
                    }
                  />

                </label>


                {/* Shelf Life */}

                <label className="browse-edit-field">

                  <span>
                    保质期 (天)
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      activeForm
                        .shelfLife
                    }
                    onChange={
                      (event) =>
                        updateEditField(
                          activeItem
                            .browseId,

                          'shelfLife',

                          event
                            .target
                            .value
                        )
                    }
                  />

                </label>

              </>
            )}

        </section>


        {/* =====================
            Fixed Bottom Actions
        ===================== */}

        <div className="browse-bottom-actions">

          <button
            className="browse-cancel"
            type="button"
            onClick={
              () =>
                setMode(
                  'browse'
                )
            }
          >
            取消加入
          </button>


          <button
            className="browse-selected-button"
            type="button"
            disabled={
              !canSubmit
            }
            onClick={
              handleAddAll
            }
          >
            加入冰箱
          </button>

        </div>

      </main>

    </div>
  )
}


export default FridgeBrowse
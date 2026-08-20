import {
  useMemo,
  useState,
} from 'react'

import ConfirmModal from '../components/ConfirmModal'

import './Fridge.css'


/* =========================
   Format Date
========================= */

const formatDate = (date) => {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  )
    .format(
      new Date(date)
    )
    .replaceAll('/', '.')
}


/* =========================
   Days Left
========================= */

function getDaysLeft(expiryDate) {
  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0
  )

  const expiry =
    new Date(expiryDate)

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
   Status
========================= */

function getStatus(item) {
  const daysLeft =
    getDaysLeft(
      item.expiryDate
    )

  if (daysLeft < 0) {
    return {
      type: 'expired',
      text: '已过期',
    }
  }

  if (daysLeft <= 4) {
    return {
      type: 'expiring',

      text:
        daysLeft === 0
          ? '今天过期'
          : `${daysLeft}天后过期`,
    }
  }

  return {
    type: 'fresh',
    text: '新鲜',
  }
}


/* =========================
   Categories
========================= */

const categories = [
  '全部',
  '肉类',
  '海鲜',
  '果蔬',
  '乳制品',
]


/* =========================
   Component
========================= */

function Fridge({
  items,
  setItems,
  onOpenAdd,
  onOpenEdit,
  onToast,
}) {

  const [
    search,
    setSearch,
  ] = useState('')


  const [
    activeCategory,
    setActiveCategory,
  ] = useState('全部')


  const [
    showClearConfirm,
    setShowClearConfirm,
  ] = useState(false)


  /* list / grid */

  const [
    viewMode,
    setViewMode,
  ] = useState('list')



  /* =========================
     Filter + Sort
  ========================= */

  const filteredItems =
    useMemo(() => {

      const statusOrder = {
        expired: 0,
        expiring: 1,
        fresh: 2,
      }


      return items

        .filter((item) => {

          const keyword =
            search.trim()


          const matchesSearch =
            item.name.includes(
              keyword
            )


          const matchesCategory =
            activeCategory ===
              '全部' ||
            item.category ===
              activeCategory


          return (
            matchesSearch &&
            matchesCategory
          )
        })


        .sort((a, b) => {

          const statusA =
            getStatus(a).type


          const statusB =
            getStatus(b).type


          const difference =
            statusOrder[
              statusA
            ] -
            statusOrder[
              statusB
            ]


          if (difference !== 0) {
            return difference
          }


          return (
            new Date(
              a.expiryDate
            ) -
            new Date(
              b.expiryDate
            )
          )
        })

    }, [
      items,
      search,
      activeCategory,
    ])



  /* =========================
     Status Counts
  ========================= */

  const counts =
    useMemo(() => {

      return items.reduce(
        (
          result,
          item
        ) => {

          const status =
            getStatus(
              item
            ).type


          result[
            status
          ] += 1


          return result
        },
        {
          expired: 0,
          expiring: 0,
          fresh: 0,
        }
      )

    }, [items])



  /* =========================
     Delete
  ========================= */

  const deleteItem =
    (id) => {

      setItems(
        (
          currentItems
        ) =>
          currentItems.filter(
            (item) =>
              item.id !== id
          )
      )

      onToast?.(
        '已删除食材'
      )
    }



  /* =========================
     Clear
  ========================= */

  const confirmClear =
    () => {

      setItems([])

      setShowClearConfirm(
        false
      )

      onToast?.(
        '冰箱已清空'
      )
    }



  return (

    <div className="fridge-app">

      <main className="fridge-page">


        {/* Header */}

        <header className="fridge-header">

          <h1>
            我的冰箱
          </h1>


          <button
            className="clear-button"
            type="button"

            onClick={() =>
              setShowClearConfirm(
                true
              )
            }
          >
            清空
          </button>

        </header>



        {/* Search */}

        <div className="fridge-search">

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

            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>



        {/* Category */}

        <div className="category-tabs">

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
                    ? 'category-tab active'
                    : 'category-tab'
                }

                onClick={() =>
                  setActiveCategory(
                    category
                  )
                }
              >
                {category}
              </button>

            )
          )}

        </div>



        {/* Status */}

        <section className="fridge-status-card">

          <div className="fridge-status-item expired">

            <span className="fridge-status-number">
              {counts.expired}
            </span>

            <span>
              已过期
            </span>

          </div>


          <div className="fridge-status-item expiring">

            <span className="fridge-status-number">
              {counts.expiring}
            </span>

            <span>
              快过期
            </span>

          </div>


          <div className="fridge-status-item fresh">

            <span className="fridge-status-number">
              {counts.fresh}
            </span>

            <span>
              新鲜
            </span>

          </div>

        </section>



        {/* Quick Add */}

        <section className="quick-add">

          <button
            className="quick-add-main"
            type="button"

            onClick={() =>
              onOpenAdd(null)
            }
          >

            <img
              src="/images/icons/icon-add-green.png"
              alt=""
            />

            快速添加

          </button>


          <button
            className="quick-chip"
            type="button"

            onClick={() =>
              onOpenAdd('003')
            }
          >
            鸡蛋
          </button>


          <button
            className="quick-chip"
            type="button"

            onClick={() =>
              onOpenAdd('004')
            }
          >
            牛奶
          </button>


          <button
            className="quick-chip"
            type="button"

            onClick={() =>
              onOpenAdd('001')
            }
          >
            土豆
          </button>

        </section>



        {/* =====================
            Inventory Header
        ===================== */}

        <div className="inventory-header">

          <h2>

            {activeCategory ===
            '全部'
              ? '全部库存'
              : activeCategory}{' '}

            (
            {filteredItems.length}
            )

          </h2>


          <div className="view-buttons">


            {/* List View */}

            <button
              className={
                viewMode === 'list'
                  ? 'view-button active list-view'
                  : 'view-button list-view'
              }

              type="button"

              aria-label="列表视图"

              onClick={() =>
                setViewMode(
                  'list'
                )
              }
            >

              <span></span>
              <span></span>
              <span></span>

            </button>



            {/* Grid View */}

            <button
              className={
                viewMode === 'grid'
                  ? 'view-button active grid-view'
                  : 'view-button grid-view'
              }

              type="button"

              aria-label="网格视图"

              onClick={() =>
                setViewMode(
                  'grid'
                )
              }
            >

              <span></span>
              <span></span>
              <span></span>
              <span></span>

            </button>

          </div>

        </div>



        {/* =====================
            Inventory
        ===================== */}

        {filteredItems.length >
        0 ? (


          /* =====================
             LIST VIEW
          ===================== */

          viewMode === 'list' ? (

            <section className="inventory-list">

              {filteredItems.map(
                (item) => {

                  const status =
                    getStatus(
                      item
                    )


                  return (

                    <article
                      className="ingredient-card"

                      key={
                        item.id
                      }
                    >


                      {/* Image */}

                      {item.image ? (

                        <img
                          className="ingredient-image"

                          src={
                            item.image
                          }

                          alt={
                            item.name
                          }
                        />

                      ) : (

                        <div className="ingredient-image ingredient-image-placeholder">

                          {item.name.slice(
                            0,
                            1
                          )}

                        </div>

                      )}



                      {/* Info */}

                      <div className="ingredient-info">

                        <div className="ingredient-name-row">

                          <h3>
                            {item.name}
                          </h3>


                          <span
                            className={`status-dot ${status.type}`}
                          />

                        </div>



                        <div className="ingredient-details">


                          {/* Quantity optional */}

                          {item.quantity !== null &&
                            item.quantity !== undefined && (

                              <>

                                <span>
                                  {item.quantity}{' '}
                                  {item.unit}
                                </span>

                                <span>
                                  ·
                                </span>

                              </>

                            )}



                          <span>

                            {formatDate(
                              item.addedDate
                            )}{' '}

                            加入

                          </span>


                          <span>
                            ·
                          </span>


                          <span
                            className={`ingredient-status ${status.type}`}
                          >

                            {status.text}

                          </span>

                        </div>

                      </div>



                      {/* Actions */}

                      <div className="ingredient-actions">

                        <button
                          className="action-button edit"

                          type="button"

                          aria-label={`编辑${item.name}`}

                          onClick={() =>
    onOpenEdit(item)
  }
                        >

                          <img
                            src="/images/icons/icon-edit.png"
                            alt=""
                          />

                        </button>


                        <button
                          className="action-button delete"

                          type="button"

                          aria-label={`删除${item.name}`}

                          onClick={() =>
                            deleteItem(
                              item.id
                            )
                          }
                        >

                          <img
                            src="/images/icons/icon-delete.png"
                            alt=""
                          />

                        </button>

                      </div>

                    </article>

                  )
                }
              )}

            </section>


          ) : (


            /* =====================
               GRID VIEW
            ===================== */

            <section className="inventory-grid">

              {filteredItems.map(
                (item) => {

                  const status =
                    getStatus(
                      item
                    )


                  return (

                    <article
                      className="grid-ingredient-card"

                      key={
                        item.id
                      }
                    >


                      {/* Status dot */}

                      <span
                        className={`grid-status-dot ${status.type}`}
                      />


                      {/* Image */}

                      {item.image ? (

                        <img
                          className="grid-ingredient-image"

                          src={
                            item.image
                          }

                          alt={
                            item.name
                          }
                        />

                      ) : (

                        <div className="grid-ingredient-image grid-ingredient-placeholder">

                          {item.name.slice(
                            0,
                            1
                          )}

                        </div>

                      )}


                      {/* Name */}

                      <span className="grid-ingredient-name">

                        {item.name}

                      </span>

                    </article>

                  )
                }
              )}

            </section>

          )


        ) : (

          <div className="fridge-empty">

            <p>
              冰箱里还没有符合条件的食材
            </p>

          </div>

        )}

      </main>



      {/* Floating Add */}

      <button
        className="floating-add"

        type="button"

        aria-label="添加食材"

        onClick={() =>
          onOpenAdd(null)
        }
      >

        <img
          src="/images/icons/icon-add-white.png"
          alt=""
        />

      </button>



      {/* Clear Confirm */}

      {showClearConfirm && (

        <ConfirmModal

          message="确认清空冰箱食材吗？"

          onCancel={() =>
            setShowClearConfirm(
              false
            )
          }

          onConfirm={
            confirmClear
          }

        />

      )}

    </div>

  )
}


export default Fridge
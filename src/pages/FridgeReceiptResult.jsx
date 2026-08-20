import {
  useState,
} from 'react'

import ingredients from '../data/ingredients'

import './FridgeReceiptResult.css'


function parseQuantity(
  text,
  defaultUnit = 'g'
) {
  const value =
    String(text || '').trim()

  if (!value) {
    return {
      quantity: null,
      unit: defaultUnit,
    }
  }

  const match =
    value.match(
      /^(\d+(?:\.\d+)?)\s*(.*)$/
    )

  if (!match) {
    return {
      quantity: null,
      unit: defaultUnit,
    }
  }

  return {
    quantity:
      Number(match[1]),

    unit:
      match[2].trim() ||
      defaultUnit,
  }
}


function formatDisplayDate(
  dateString
) {
  if (!dateString) {
    return ''
  }

  const [
    year,
    month,
    day,
  ] = dateString.split('-')

  return `${day}.${month}.${year}`
}


function FridgeReceiptResult({
  initialItems = [],
  onCancel,
  onAddAll,
  onOpenBrowse,
  onOpenQuickAdd,
  onOpenScan,
}) {

  const [
    items,
    setItems,
  ] = useState(
    initialItems
  )


  const [
    editingId,
    setEditingId,
  ] = useState(null)


  const [
    editDraft,
    setEditDraft,
  ] = useState(null)



  /* =========================
     Delete
  ========================= */

  const deleteItem =
    (id) => {

      setItems(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      )
    }



  /* =========================
     Start Edit
  ========================= */

  const startEdit =
    (item) => {

      setEditingId(
        item.id
      )

      setEditDraft({
        ...item,
      })
    }



  /* =========================
     Cancel Edit
  ========================= */

  const cancelEdit =
    () => {

      setEditingId(
        null
      )

      setEditDraft(
        null
      )
    }



  /* =========================
     Save Edit
  ========================= */

  const saveEdit =
    () => {

      if (!editDraft) {
        return
      }


      if (
        !editDraft.name
          .trim()
      ) {
        return
      }


      setItems(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              editingId
                ? {
                    ...editDraft,

                    name:
                      editDraft
                        .name
                        .trim(),
                  }
                : item
          )
      )


      cancelEdit()
    }



  /* =========================
     Update Draft
  ========================= */

  const updateDraft =
    (
      field,
      value
    ) => {

      setEditDraft(
        (current) => ({
          ...current,

          [field]:
            value,
        })
      )
    }



  /* =========================
     Add All To Fridge
  ========================= */

  const handleAddAll =
    () => {

      if (
        items.length === 0
      ) {
        return
      }


      const fridgeItems =
        items.map(
          (item) => {

            const matchedIngredient =
              ingredients.find(
                (ingredient) =>
                  ingredient.name ===
                  item.name.trim()
              )


            const defaultUnit =
              matchedIngredient
                ?.defaultUnit ||
              'g'


            const parsed =
              parseQuantity(
                item.quantityText,
                defaultUnit
              )


            const addedDate =
              new Date(
                `${item.purchaseDate}T00:00:00`
              )


            const expiryDate =
              new Date(
                addedDate
              )


            expiryDate.setDate(
              expiryDate.getDate() +
              Number(
                item.shelfLife ||
                0
              )
            )


            return {
              ingredientId:
                matchedIngredient
                  ?.id ||
                null,

              name:
                item.name.trim(),

              category:
                matchedIngredient
                  ?.category ||
                item.category ||
                '肉类',

              quantity:
                parsed.quantity,

              unit:
                parsed.unit,

              image:
                matchedIngredient
                  ?.image ||
                item.image ||
                '',

              addedDate,

              expiryDate,
            }
          }
        )


      onAddAll(
        fridgeItems
      )
    }



  return (

    <div className="receipt-result-app">

      <main className="receipt-result-page">


        {/* =====================
            Header
        ===================== */}

        <header className="receipt-result-header">

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

        <section className="receipt-result-methods">


          {/* Scan */}

          <button
            className="receipt-result-method active"
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



          {/* Browse */}

          <button
            className="receipt-result-method"
            type="button"
            onClick={
              onOpenBrowse
            }
          >

            <img
              src="/images/icons/icon-search.png"
              alt=""
            />

            <span>
              浏览添加
            </span>

          </button>



          {/* Quick */}

          <button
            className="receipt-result-method"
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
            Result Card
        ===================== */}

        <section className="receipt-result-card">

          <h2>
            扫描到 {items.length} 种食材
          </h2>



          <div className="receipt-result-list">

            {items.map(
              (item) => (

                <div
                  className="receipt-result-item-wrap"
                  key={
                    item.id
                  }
                >


                  {/* =====================
                      Normal Item
                  ===================== */}

                  <article className="receipt-result-item">


                    <div className="receipt-result-info">

                      <h3>
                        {item.name}
                      </h3>


                      <div className="receipt-result-meta">

                        {item.quantityText && (
                          <>
                            <span>
                              {item.quantityText}
                            </span>

                            <span>
                              ·
                            </span>
                          </>
                        )}


                        <span>
                          {formatDisplayDate(
                            item.purchaseDate
                          )}{' '}
                          加入
                        </span>


                        <span>
                          ·
                        </span>


                        <span>
                          {item.shelfLife}
                          天后过期
                        </span>

                      </div>

                    </div>



                    {/* Actions */}

                    <div className="receipt-result-actions">

                      <button
                        className="receipt-item-action edit"
                        type="button"

                        aria-label={`编辑${item.name}`}

                        onClick={() =>
                          startEdit(
                            item
                          )
                        }
                      >

                        <img
                          src="/images/icons/icon-edit.png"
                          alt=""
                        />

                      </button>


                      <button
                        className="receipt-item-action delete"
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



                  {/* =====================
                      Edit Area
                  ===================== */}

                  {editingId ===
                    item.id &&
                    editDraft && (

                    <div className="receipt-result-edit">


                      <label>

                        <span>
                          食材名称
                        </span>

                        <input
                          type="text"

                          value={
                            editDraft.name
                          }

                          onChange={(event) =>
                            updateDraft(
                              'name',
                              event.target.value
                            )
                          }
                        />

                      </label>



                      <label>

                        <span>
                          数量
                        </span>

                        <input
                          type="text"

                          value={
                            editDraft.quantityText
                          }

                          placeholder="例：300g"

                          onChange={(event) =>
                            updateDraft(
                              'quantityText',
                              event.target.value
                            )
                          }
                        />

                      </label>



                      <label>

                        <span>
                          购买日期
                        </span>

                        <input
                          type="date"

                          value={
                            editDraft.purchaseDate
                          }

                          onChange={(event) =>
                            updateDraft(
                              'purchaseDate',
                              event.target.value
                            )
                          }
                        />

                      </label>



                      <label>

                        <span>
                          保质期 (天)
                        </span>

                        <input
                          type="number"
                          min="0"

                          value={
                            editDraft.shelfLife
                          }

                          onChange={(event) =>
                            updateDraft(
                              'shelfLife',
                              event.target.value
                            )
                          }
                        />

                      </label>



                      <div className="receipt-edit-actions">

                        <button
                          type="button"
                          className="receipt-edit-cancel"

                          onClick={
                            cancelEdit
                          }
                        >
                          取消
                        </button>


                        <button
                          type="button"
                          className="receipt-edit-save"

                          onClick={
                            saveEdit
                          }
                        >
                          保存
                        </button>

                      </div>

                    </div>

                  )}

                </div>

              )
            )}

          </div>



          {items.length === 0 && (

            <div className="receipt-result-empty">

              没有可加入的食材

            </div>

          )}

        </section>

      </main>



      {/* =====================
          Fixed Bottom
      ===================== */}

      <div className="receipt-result-footer">

        <button
          className="receipt-result-cancel"
          type="button"

          onClick={
            onCancel
          }
        >
          取消加入
        </button>


        <button
          className="receipt-result-confirm"
          type="button"

          disabled={
            items.length === 0
          }

          onClick={
            handleAddAll
          }
        >
          加入冰箱
        </button>

      </div>

    </div>

  )
}


export default FridgeReceiptResult
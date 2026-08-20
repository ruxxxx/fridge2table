import './ConfirmModal.css'

function ConfirmModal({
  message,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="confirm-overlay">

      <div className="confirm-modal">

        <p className="confirm-message">
          {message}
        </p>

        <div className="confirm-actions">

          <button
            className="confirm-cancel"
            onClick={onCancel}
          >
            取消
          </button>

          <button
            className="confirm-confirm"
            onClick={onConfirm}
          >
            确认
          </button>

        </div>

      </div>

    </div>
  )
}

export default ConfirmModal
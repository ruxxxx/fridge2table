import './Toast.css'


function Toast({
  message,
  visible,
}) {

  return (

    <div
      className={
        visible
          ? 'global-toast show'
          : 'global-toast'
      }
    >

      <span className="global-toast-icon">
        ✓
      </span>

      <span>
        {message}
      </span>

    </div>

  )
}


export default Toast
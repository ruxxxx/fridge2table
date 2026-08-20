import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  createWorker,
} from 'tesseract.js'

import './FridgeReceiptScan.css'


function FridgeReceiptScan({
  onCancel,
  onOpenBrowse,
  onOpenQuickAdd,
  onCaptureDone,
}) {

  const videoRef =
    useRef(null)

  const canvasRef =
    useRef(null)

  const streamRef =
    useRef(null)

  const workerRef =
    useRef(null)

  const cancelledRef =
    useRef(false)


  const [
    isCameraOn,
    setIsCameraOn,
  ] = useState(false)


  const [
    capturedImage,
    setCapturedImage,
  ] = useState(null)


  const [
    error,
    setError,
  ] = useState('')


  const [
    isRecognizing,
    setIsRecognizing,
  ] = useState(false)


  const [
    ocrProgress,
    setOcrProgress,
  ] = useState(0)



  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {

    cancelledRef.current =
      false


    return () => {

      cancelledRef.current =
        true


      stopCamera()


      if (
        workerRef.current
      ) {

        workerRef.current
          .terminate()
          .catch(
            () => {}
          )


        workerRef.current =
          null
      }
    }

  }, [])



  /* =========================================================
     STOP CAMERA
  ========================================================= */

  const stopCamera =
    () => {

      if (
        streamRef.current
      ) {

        streamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          )


        streamRef.current =
          null
      }


      if (
        videoRef.current
      ) {

        videoRef.current
          .srcObject =
          null
      }


      setIsCameraOn(
        false
      )
    }



  /* =========================================================
     START CAMERA
  ========================================================= */

  const startCamera =
    async () => {

      try {

        cancelledRef.current =
          false


        setError('')

        setCapturedImage(
          null
        )

        setOcrProgress(
          0
        )


        if (
          !navigator
            .mediaDevices
            ?.getUserMedia
        ) {

          throw new Error(
            'Camera API unavailable'
          )
        }


        const stream =
          await navigator
            .mediaDevices
            .getUserMedia(
              {
                video: {
                  facingMode: {
                    ideal:
                      'environment',
                  },
                },

                audio: false,
              }
            )


        streamRef.current =
          stream


        if (
          videoRef.current
        ) {

          videoRef.current
            .srcObject =
            stream


          await videoRef.current
            .play()
            .catch(
              () => {}
            )
        }


        setIsCameraOn(
          true
        )

      } catch (
        cameraError
      ) {

        console.error(
          cameraError
        )


        setError(
          '无法打开摄像头，请检查浏览器的摄像头权限。'
        )
      }
    }



  /* =========================================================
     OCR
  ========================================================= */

  const recognizeReceipt =
    async (
      imageData
    ) => {

      try {

        setIsRecognizing(
          true
        )

        setError('')

        setOcrProgress(
          0
        )


        /*
          目前使用英文 OCR。

          之后如果需要中文：
          createWorker([
            'eng',
            'chi_sim'
          ])
        */


        const worker =
          await createWorker(
            'eng',
            1,
            {
              logger: (
                message
              ) => {

                if (
                  message.status ===
                    'recognizing text' &&
                  typeof
                    message.progress ===
                    'number'
                ) {

                  setOcrProgress(
                    Math.round(
                      message.progress *
                      100
                    )
                  )
                }
              },
            }
          )


        workerRef.current =
          worker


        const result =
          await worker
            .recognize(
              imageData
            )


        const text =
          result
            ?.data
            ?.text ||
          ''


        console.log(
          'OCR RAW TEXT:',
          text
        )


        await worker
          .terminate()


        workerRef.current =
          null


        if (
          cancelledRef.current
        ) {
          return
        }


        setOcrProgress(
          100
        )


        setIsRecognizing(
          false
        )


        onCaptureDone(
          imageData,
          text
        )

      } catch (
        ocrError
      ) {

        console.error(
          'OCR error:',
          ocrError
        )


        if (
          workerRef.current
        ) {

          await workerRef
            .current
            .terminate()
            .catch(
              () => {}
            )


          workerRef.current =
            null
        }


        if (
          cancelledRef.current
        ) {
          return
        }


        setIsRecognizing(
          false
        )


        setError(
          '小票识别失败，请重新拍摄。'
        )
      }
    }



  /* =========================================================
     CAPTURE
  ========================================================= */

  const captureReceipt =
    async () => {

      if (
        !videoRef.current ||
        !canvasRef.current
      ) {
        return
      }


      const video =
        videoRef.current


      if (
        !video.videoWidth ||
        !video.videoHeight
      ) {

        setError(
          '摄像头仍在加载，请稍等一下再拍。'
        )

        return
      }


      const canvas =
        canvasRef.current


      const context =
        canvas.getContext(
          '2d'
        )


      if (!context) {
        return
      }


      canvas.width =
        video.videoWidth


      canvas.height =
        video.videoHeight


      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      )


      const imageData =
        canvas.toDataURL(
          'image/jpeg',
          0.92
        )


      setCapturedImage(
        imageData
      )


      stopCamera()


      await recognizeReceipt(
        imageData
      )
    }



  /* =========================================================
     CANCEL / SWITCH PAGE
  ========================================================= */

  const leavePage =
    (callback) => {

      cancelledRef.current =
        true


      stopCamera()


      if (
        workerRef.current
      ) {

        workerRef.current
          .terminate()
          .catch(
            () => {}
          )


        workerRef.current =
          null
      }


      callback?.()
    }



  /* =========================================================
     PRIMARY BUTTON
  ========================================================= */

  const handlePrimaryAction =
    () => {

      if (
        isRecognizing
      ) {
        return
      }


      if (
        isCameraOn
      ) {

        captureReceipt()

        return
      }


      startCamera()
    }



  const primaryButtonText =
    isRecognizing

      ? `正在识别 ${ocrProgress}%`

      : isCameraOn

        ? '拍照识别'

        : capturedImage

          ? '重新拍摄'

          : '开始扫描'



  /* =========================================================
     UI
  ========================================================= */

  return (

    <div className="fridge-scan-app">

      <main className="fridge-scan-page">


        {/* Header */}

        <header className="fridge-scan-header">

          <h1>
            添加食材
          </h1>

          <p>
            选择添加食材的方式
          </p>

        </header>



        {/* Methods */}

        <section className="scan-methods">


          {/* Scan */}

          <button
            className="scan-method-card active"

            type="button"

            disabled={
              isRecognizing
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
            className="scan-method-card"

            type="button"

            disabled={
              isRecognizing
            }

            onClick={() =>
              leavePage(
                onOpenBrowse
              )
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
            className="scan-method-card"

            type="button"

            disabled={
              isRecognizing
            }

            onClick={() =>
              leavePage(
                onOpenQuickAdd
              )
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



        {/* Camera Area */}

        <section className="scan-preview-card">


          {/* Empty */}

          {!isCameraOn &&
            !capturedImage && (

            <div className="scan-placeholder">

              <img
                src="/images/icons/icon-scan.png"
                alt=""
              />


              <h2>
                准备扫描小票
              </h2>


              <p>
                将小票放在光线充足的环境中
              </p>


              <p className="scan-placeholder-sub">
                点击“开始扫描”后开启摄像头
              </p>

            </div>

          )}



          {/* Camera */}

          {isCameraOn && (

            <div className="camera-preview">

              <video
                ref={
                  videoRef
                }

                autoPlay

                playsInline

                muted

                className="camera-video"
              />


              <div className="camera-overlay">


                <div className="receipt-frame">

                  <span className="corner top-left"></span>

                  <span className="corner top-right"></span>

                  <span className="corner bottom-left"></span>

                  <span className="corner bottom-right"></span>

                </div>


                <p className="camera-hint">
                  将小票完整放入框内
                </p>

              </div>

            </div>

          )}



          {/* Captured + OCR */}

          {!isCameraOn &&
            capturedImage && (

            <div className="captured-preview">

              <img
                src={
                  capturedImage
                }

                alt="已拍摄的小票"

                className="captured-image"
              />


              <div className="captured-mask">

                <div className="captured-badge">

                  {isRecognizing

                    ? `正在识别小票 ${ocrProgress}%`

                    : '已拍摄'}

                </div>

              </div>

            </div>

          )}



          <canvas
            ref={
              canvasRef
            }

            className="hidden-canvas"
          />

        </section>



        {/* Error */}

        {error && (

          <p className="scan-error">
            {error}
          </p>

        )}

      </main>



      {/* Fixed Footer */}

      <div className="scan-footer">


        <button
          className="scan-footer-button secondary"

          type="button"

          disabled={
            isRecognizing
          }

          onClick={() =>
            leavePage(
              onCancel
            )
          }
        >
          取消扫描
        </button>



        <button
          className="scan-footer-button primary"

          type="button"

          disabled={
            isRecognizing
          }

          onClick={
            handlePrimaryAction
          }
        >

          {primaryButtonText}

        </button>

      </div>

    </div>

  )
}


export default FridgeReceiptScan
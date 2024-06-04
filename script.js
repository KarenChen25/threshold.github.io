let originalImage = null;
let grayImage = null;
let binaryTraditionalImage = null;
let binaryOtsuImage = null;
let edgeImage = null;

// 获取 canvas 和上传图片的元素
let canvasContainer = document.getElementById("canvasContainer");
let imageUpload = document.getElementById("imageUpload");

// 隐藏 canvas 容器
canvasContainer.style.display = "none";

// 监听上传图片的 input 元素的 change 事件
imageUpload.addEventListener("change", function () {
  // 用户选择了图片，显示 canvas 容器
  canvasContainer.style.display = "flex";

  // 在这里调用处理图片的函数，例如 processImage 函数
});

// 其他 JavaScript 代码

function onOpenCvReady() {
  console.log("OpenCV.js is ready.");
}

document.getElementById("imageUpload").addEventListener("change", function (e) {
  let file = e.target.files[0];
  if (file) {
    let reader = new FileReader();
    reader.onload = function (event) {
      let imgElement = new Image();
      imgElement.onload = function () {
        processImage(imgElement);
      };
      imgElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

function processImage(imgElement) {
  let src = cv.imread(imgElement);
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // 传统阈值
  let binaryTraditional = new cv.Mat();
  cv.threshold(gray, binaryTraditional, 128, 255, cv.THRESH_BINARY);

  // Otsu's Threshold
  let binaryOtsu = new cv.Mat();
  cv.threshold(gray, binaryOtsu, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

  let edges = new cv.Mat();
  cv.Canny(gray, edges, 50, 150, 3, false);

  originalImage = imgElement;
  grayImage = gray;
  binaryTraditionalImage = binaryTraditional;
  binaryOtsuImage = binaryOtsu;
  edgeImage = edges;

  // 获取图像的宽度和高度
  let imgWidth = imgElement.width;
  let imgHeight = imgElement.height;

  // 根据图像宽高比设置 scale 值
  let scale = imgWidth > imgHeight ? 0.15 : 0.35;

  displayImages(scale);
  src.delete();
}

// 计算黑白区块
function calculateBlackWhiteRatio(binaryImage) {
  let blackPixels = 0;
  let whitePixels = 0;

  // 获取二值化图像的像素数据
  let imgData = binaryImage.data;
  let numPixels = imgData.length / 4; // 每个像素有 4 个字节（RGBA）

  // 遍历每个像素
  for (let i = 0; i < numPixels; i++) {
    let index = i * 4;
    let pixelValue = imgData[index]; // 取得像素的灰度值

    // 如果像素值为 0，则认为是黑色像素
    if (pixelValue === 0) {
      blackPixels++;
    } else if (pixelValue === 255) {
      // 如果像素值为 255，则认为是白色像素
      whitePixels++;
    }
  }

  // 计算黑白像素的比例
  let blackRatio = blackPixels / numPixels;
  let whiteRatio = whitePixels / numPixels;

  return `黑：${(blackRatio * 100).toFixed(2)}%\n白：${(
    whiteRatio * 100
  ).toFixed(2)}%`;
}

function displayImages(scale) {
  let canvasOriginal = document.getElementById("canvasOriginal");
  let canvasGray = document.getElementById("canvasGray");
  let canvasBinaryTraditional = document.getElementById(
    "canvasBinaryTraditional"
  );
  let canvasBinaryOtsu = document.getElementById("canvasBinaryOtsu");
  let canvasEdge = document.getElementById("canvasEdge");

  let contextOriginal = canvasOriginal.getContext("2d");
  let contextGray = canvasGray.getContext("2d");
  let contextBinaryTraditional = canvasBinaryTraditional.getContext("2d");
  let contextBinaryOtsu = canvasBinaryOtsu.getContext("2d");
  let contextEdge = canvasEdge.getContext("2d");

  canvasOriginal.width = originalImage.width * scale;
  canvasOriginal.height = originalImage.height * scale;
  canvasGray.width = grayImage.cols * scale;
  canvasGray.height = grayImage.rows * scale;
  canvasBinaryTraditional.width = binaryTraditionalImage.cols * scale;
  canvasBinaryTraditional.height = binaryTraditionalImage.rows * scale;
  canvasBinaryOtsu.width = binaryOtsuImage.cols * scale;
  canvasBinaryOtsu.height = binaryOtsuImage.rows * scale;
  canvasEdge.width = edgeImage.cols * scale;
  canvasEdge.height = edgeImage.rows * scale;

  contextOriginal.drawImage(
    originalImage,
    0,
    0,
    canvasOriginal.width,
    canvasOriginal.height
  );
  cv.imshow(canvasGray, scaleMat(grayImage, scale));
  cv.imshow(canvasBinaryTraditional, scaleMat(binaryTraditionalImage, scale));
  cv.imshow(canvasBinaryOtsu, scaleMat(binaryOtsuImage, scale));
  cv.imshow(canvasEdge, scaleMat(edgeImage, scale));

  // 计算并显示二值化图像的黑白像素比例
  let blackWhiteRatioTraditional = calculateBlackWhiteRatio(
    binaryTraditionalImage
  );
  let blackWhiteRatioOtsu = calculateBlackWhiteRatio(binaryOtsuImage);

  // 在页面上显示黑白像素比例
  document.getElementById("blackWhiteRatioTraditional").innerText =
    blackWhiteRatioTraditional;
  document.getElementById("blackWhiteRatioOtsu").innerText =
    blackWhiteRatioOtsu;
}

function scaleMat(mat, scale) {
  let dst = new cv.Mat();
  cv.resize(mat, dst, new cv.Size(), scale, scale, cv.INTER_LINEAR);
  return dst;
}

document
  .getElementById("downloadButton")
  .addEventListener("click", function () {
    if (
      originalImage &&
      grayImage &&
      binaryTraditionalImage &&
      binaryOtsuImage
    ) {
      downloadImages();
    } else {
      alert("Please upload an image first.");
    }
  });

function downloadImages() {
  let linkOriginal = document.createElement("a");
  linkOriginal.download = "original_image.png";
  linkOriginal.href = originalImage.src;
  linkOriginal.click();

  let canvas = document.createElement("canvas");
  canvas.width = grayImage.cols;
  canvas.height = grayImage.rows;
  cv.imshow(canvas, grayImage);
  let linkGray = document.createElement("a");
  linkGray.download = "gray_image.png";
  linkGray.href = canvas.toDataURL();
  linkGray.click();

  canvas = document.createElement("canvas");
  canvas.width = binaryTraditionalImage.cols;
  canvas.height = binaryTraditionalImage.rows;
  cv.imshow(canvas, binaryTraditionalImage);
  let linkBinaryTraditional = document.createElement("a");
  linkBinaryTraditional.download = "binary_image.png";
  linkBinaryTraditional.href = canvas.toDataURL();
  linkBinaryTraditional.click();

  canvas = document.createElement("canvas");
  canvas.width = binaryOtsuImage.cols;
  canvas.height = binaryOtsuImage.rows;
  cv.imshow(canvas, binaryOtsuImage);
  let linkBinaryOtsu = document.createElement("a");
  linkBinaryOtsu.download = "binary_image_otsu.png";
  linkBinaryOtsu.href = canvas.toDataURL();
  linkBinaryOtsu.click();

  canvas = document.createElement("canvas");
  canvas.width = edgeImage.cols;
  canvas.height = edgeImage.rows;
  cv.imshow(canvas, edgeImage);
  let linkEdge = document.createElement("a");
  linkEdge.download = "edge_image.png";
  linkEdge.href = canvas.toDataURL();
  linkEdge.click();
}

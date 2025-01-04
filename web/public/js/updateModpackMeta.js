/** MODIFY INPUT ICON */

/**
 * Convert an Image URL to the display image.
 * @param {string} fileUri The URL of the file to use.
 * @param {(blob: Blob) => void} callback The callback run, contains byte array.
 */
function generateDisplayImg(fileUri, callback) {
  let canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, 128, 128);
    ctx.drawImage(img, 0, 0, 128, 128);
    canvas.toBlob((blob) => {
      callback(blob);
    });
  };
  img.src = fileUri;
}

/**
 * Load the new file
 * @param {File} file The file to process.
 */
function loadFile(file) {
  generateDisplayImg(URL.createObjectURL(file), (blob) => {
    const newFile = new File([blob], file.name, {
      type: "image/jpeg",
    });

    document.getElementById("new_image").src = URL.createObjectURL(newFile);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(newFile);
    newIconUpload.files = dataTransfer.files;
  });
}

/**
 * Handle a new image being selected.
 * @param {Event} evt The load event.
 */
function handleImageSelect(evt) {
  console.info("[Event] Load image");
  loadFile(evt.target.files[0]);
}

// Attach the listener
const newIconUpload = document.getElementById("icon");
newIconUpload.addEventListener("change", handleImageSelect, false);

// Run if the file field already has a file.
if (newIconUpload.files.length >= 1) {
  console.info("[Event] Load image");
  loadFile(newIconUpload.files[0]);
}

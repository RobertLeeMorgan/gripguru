const uploadField = document.getElementById("formFileMultiple");

uploadField.onchange = function () {
  for (let i = 0; i <= this.files.length; i++) {
    if (this.files[i].size > 1024 ** 5 || this.files.length > 4) {
      alert("Max 4 images/max 5mb per image");
      this.value = "";
    }
  }
};

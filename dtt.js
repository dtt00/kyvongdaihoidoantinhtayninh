$(document).ready(function () {
    let cropper;

    // --- 1. KHAI BÁO BIẾN ---
    const $imageChoose = $("#image-choose");
    const $imgChoosen = $("#img-choosen");
    const $cropperImage = $("#cropperImage");
    const $cropperModal = $("#cropperModal");
    const $saveCroppedImage = $("#saveCroppedImage");
    const $closeModal = $(".close");
    const $resultModal = $("#resultModal");
    const $closeResultBtn = $("#closeResultBtn");

    // --- 2. HÀM HỖ TRỢ ---
    function resetInput() {
        $imageChoose.val("");
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }

    // --- 3. XỬ LÝ CROP ẢNH (GIỮ NGUYÊN LOGIC CŨ) ---
    $imageChoose.on("change", function () {
        const files = this.files;
        if (files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chỉ chọn file ảnh!');
                return;
            }
            const reader = new FileReader();
            reader.onload = function (event) {
                $cropperImage.attr("src", event.target.result);
                $cropperModal.fadeIn();
                if (cropper) cropper.destroy();
                
                cropper = new Cropper($cropperImage[0], {
                    aspectRatio: 1, 
                    viewMode: 1,    
                    autoCropArea: 0.9,
                    movable: true,
                    zoomable: true,
                    rotatable: false,
                    scalable: false,
                });
            };
            reader.readAsDataURL(file);
        }
    });

    $saveCroppedImage.on("click", function () {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: 1200, 
                height: 1200,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            
            if(canvas) {
                const base64encodedImage = canvas.toDataURL("image/jpeg", 0.95);
                $imgChoosen.attr("src", base64encodedImage);
            }
            $cropperModal.fadeOut();
            resetInput();
        }
    });

    $closeModal.on("click", function () {
        $cropperModal.fadeOut();
        resetInput();
    });

    $(window).on("click", function (event) {
        if (event.target === $cropperModal[0]) {
            $cropperModal.fadeOut();
            resetInput();
        }
    });

    // --- 4. CẬP NHẬT TEXT ---
    $("#name").on("input", function () {
        $(".name-content").text($(this).val());
    });
    $("#title").on("input", function () {
        $(".title-content").text($(this).val());
    });
    $("#message").on("input", function () {
        $(".message-content").text($(this).val());
    });

    // --- 5. XỬ LÝ TẢI ẢNH (PHẦN ĐÃ SỬA LỖI) ---
    $("#submit").click(function () {
        const $btn = $(this);
        const originalText = $btn.text();
        
        // Hiển thị loading
        if($(".loader-wrapper").length) {
            $(".loader-wrapper").fadeIn();
        } else {
            $btn.text("Đang tạo ảnh...").prop("disabled", true);
        }

        const node = document.getElementById("frame-wrapper");
        const width = node.scrollWidth;
        const height = node.scrollHeight;

        // Cấu hình html2canvas
        html2canvas(node, {
            width: width,
            height: height,
            scale: 3, // Độ nét cao
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scrollY: -window.scrollY, // Fix lỗi lệch khi cuộn trang
            
            // --- KỸ THUẬT FIX VỊ TRÍ CHỮ ---
            onclone: (clonedDoc) => {
                const clonedNode = clonedDoc.getElementById("frame-wrapper");
                clonedNode.style.display = "block";
                
                // Chọn tất cả các thẻ chữ cần sửa
                const textElements = clonedNode.querySelectorAll('.name-content, .title-content, .message-content');
                
                textElements.forEach(el => {
                    // 1. Reset các transform cũ
                    el.style.transform = "none";
                    el.style.margin = "0";
                    
                    // 2. Ép dòng không bị giãn
                    el.style.lineHeight = "1.2";
                    
                    // 3. Ép font hiển thị đúng
                    const computedStyle = window.getComputedStyle(el);
                    el.style.fontFamily = computedStyle.fontFamily;
                    el.style.fontSize = computedStyle.fontSize;
                    el.style.fontWeight = computedStyle.fontWeight;
                    el.style.webkitTextSizeAdjust = "100%";

                    // 4. THỦ THUẬT: Đẩy chữ xuống 10px để bù trừ lỗi bị nhảy lên
                    // Nếu bạn thấy chữ vẫn cao -> Tăng số này lên (ví dụ "15px")
                    // Nếu bạn thấy chữ bị thấp quá -> Giảm số này xuống (ví dụ "5px")
                    el.style.marginTop = "5px"; 
                    el.style.display = "block"; // Đảm bảo nhận margin
                });

                // Fix ảnh avatar (nếu cần)
                const img = clonedNode.querySelector('#img-choosen');
                if(img) img.style.transform = "none";
            }
        }).then(canvas => {
            // Tải xuống
            try {
                const finalImgDataUrl = canvas.toDataURL("image/png", 1.0);
                const link = document.createElement('a');
                link.href = finalImgDataUrl;
                link.download = 'DaiHoiDoanTNCSHCM.png'; 
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) {
                console.error("Lỗi download:", e);
                alert("Lỗi tải ảnh. Hãy thử nhấn giữ ảnh để lưu thủ công.");
            }

            // Tắt loading
            if($(".loader-wrapper").length) {
                $(".loader-wrapper").fadeOut();
            } else {
                $btn.text(originalText).prop("disabled", false);
            }

        }).catch(err => {
            console.error("Lỗi html2canvas:", err);
            alert("Có lỗi khi tạo ảnh. Vui lòng thử lại!");
            if($(".loader-wrapper").length) {
                $(".loader-wrapper").fadeOut();
            } else {
                $btn.text(originalText).prop("disabled", false);
            }
        });
    });

    // Các sự kiện đóng modal khác
    $closeResultBtn.on("click", function() {
        $resultModal.fadeOut();
    });
    
    $(window).on("click", function (event) {
        if (event.target === $resultModal[0]) {
            $resultModal.fadeOut();
        }
    });
});

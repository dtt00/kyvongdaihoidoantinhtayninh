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

    // --- 5. XỬ LÝ TẢI ẢNH (ĐÃ FIX CHO ZALO/FB) ---
    $("#submit").click(function () {
        const $btn = $(this);
        const originalText = $btn.text();

        // 1. Hiển thị loading
        if ($(".loader-wrapper").length) {
            $(".loader-wrapper").fadeIn();
        } else {
            $btn.text("Đang tạo ảnh...").prop("disabled", true);
        }

        const node = document.getElementById("frame-wrapper");
        const width = node.scrollWidth;
        const height = node.scrollHeight;

        // 2. Chạy html2canvas
        html2canvas(node, {
            width: width,
            height: height,
            scale: 4, // Giảm scale xuống 3-4 để nhẹ máy mobile, tránh crash Zalo
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scrollY: -window.scrollY,
            onclone: (clonedDoc) => {
                const clonedNode = clonedDoc.getElementById("frame-wrapper");
                clonedNode.style.display = "block";
                
                // Fix lỗi chữ như code cũ
                const textElements = clonedNode.querySelectorAll('.name-content, .title-content, .message-content');
                textElements.forEach(el => {
                    el.style.transform = "none";
                    el.style.margin = "0";
                    el.style.lineHeight = "1.2";
                    const computedStyle = window.getComputedStyle(el);
                    el.style.fontFamily = computedStyle.fontFamily;
                    el.style.fontSize = computedStyle.fontSize;
                    el.style.fontWeight = computedStyle.fontWeight;
                    el.style.marginTop = "-5px"; 
                    el.style.display = "block";
                });

                // Fix ảnh avatar
                const img = clonedNode.querySelector('#img-choosen');
                if(img) img.style.transform = "none";
            }
        }).then(canvas => {
            // 3. Xử lý kết quả sau khi chụp xong
            const finalImgDataUrl = canvas.toDataURL("image/png", 1.0);

            // Kiểm tra xem trình duyệt có phải là Mobile hoặc nằm trong App (Zalo, FB) không
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Zalo|FBAN|FBAV/i.test(navigator.userAgent);

            if (isMobile) {
                // --- LOGIC CHO ĐIỆN THOẠI / ZALO / FB ---
                // Thay vì tải xuống (sẽ lỗi), ta hiển thị ảnh vào Modal để khách nhấn giữ lưu
                
                // Tìm thẻ img trong resultModal để gán ảnh (Nếu HTML chưa có thì bạn cần thêm)
                let $resultImg = $("#result-img-show");
                
                // Nếu chưa có thẻ img trong HTML, tạo động luôn
                if ($resultImg.length === 0) {
                    $resultModal.find(".modal-content").append('<img id="result-img-show" src="" style="width:100%; display:block; margin-bottom:10px; border-radius:10px;">');
                    $resultImg = $("#result-img-show");
                    // Thêm dòng hướng dẫn
                     $resultModal.find(".modal-content").append('<p style="text-align:center; color: red; font-weight:bold;">Nhấn giữ vào ảnh trên để Lưu về máy</p>');
                }

                $resultImg.attr("src", finalImgDataUrl);
                $resultModal.fadeIn(); // Hiện modal kết quả
                
            } else {
                // --- LOGIC CHO MÁY TÍNH (PC) ---
                // Tải xuống tự động như bình thường
                try {
                    const link = document.createElement('a');
                    link.href = finalImgDataUrl;
                    link.download = 'Kyvongdaihoidoantinhtayninh.png'; 
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {
                    console.error("Lỗi download PC:", e);
                }
            }

            // 4. Tắt loading
            if ($(".loader-wrapper").length) {
                $(".loader-wrapper").fadeOut();
            } else {
                $btn.text(originalText).prop("disabled", false);
            }

        }).catch(err => {
            console.error("Lỗi html2canvas:", err);
            alert("Có lỗi khi tạo ảnh. Vui lòng thử lại!");
            if ($(".loader-wrapper").length) {
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

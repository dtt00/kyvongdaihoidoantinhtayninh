$(document).ready(function () {
    let cropper;

    // --- Khai báo các biến ---
    const $imageChoose = $("#image-choose");
    const $imgChoosen = $("#img-choosen");
    const $cropperImage = $("#cropperImage");
    const $cropperModal = $("#cropperModal");
    const $saveCroppedImage = $("#saveCroppedImage");
    const $closeModal = $(".close");

    // Các biến cho Modal kết quả mới
    const $resultModal = $("#resultModal");
    const $finalImage = $("#finalImage");
    const $closeResultBtn = $("#closeResultBtn");
    const $downloadBtnDesktop = $("#downloadBtnDesktop");

    // Hàm reset input file
    function resetInput() {
        $imageChoose.val("");
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }

    // --- 1. Xử lý chọn và crop ảnh ---
    $imageChoose.on("change", function () {
        const files = this.files;
        if (files.length > 0) {
            const file = files[0];
            // Kiểm tra loại file
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chỉ chọn file ảnh!');
                return;
            }
            const reader = new FileReader();
            reader.onload = function (event) {
                $cropperImage.attr("src", event.target.result);
                $cropperModal.fadeIn();
                if (cropper) cropper.destroy();
                // Cấu hình cropper
                cropper = new Cropper($cropperImage[0], {
                    aspectRatio: 1, // Khung vuông
                    viewMode: 1,    // Giới hạn khung crop trong ảnh
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

    // Lưu ảnh crop
    $saveCroppedImage.on("click", function () {
        if (cropper) {
            // QUAN TRỌNG: Giới hạn kích thước ảnh sau khi crop để tránh bị nặng
            // Nếu ảnh gốc 5000x5000, nó sẽ resize về 800x800 để ghép vào khung cho nhẹ.
            const canvas = cropper.getCroppedCanvas({
                width: 800,
                height: 800,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            
            if(canvas) {
                const base64encodedImage = canvas.toDataURL("image/jpeg", 0.9);
                $imgChoosen.attr("src", base64encodedImage);
            }
            
            $cropperModal.fadeOut();
            resetInput();
        }
    });

    // Đóng modal crop
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

    // --- 2. Cập nhật nội dung text ---
    $("#name").on("input", function () {
        $(".name-content").text($(this).val());
    });
    $("#title").on("input", function () {
        $(".title-content").text($(this).val());
    });
    $("#message").on("input", function () {
        $(".message-content").text($(this).val());
    });


   // --- 3. XUẤT ẢNH VÀ TỰ ĐỘNG TẢI XUỐNG (KHÔNG HIỆN MODAL) ---
    $("#submit").click(function () {
        // 1. Hiển thị thông báo đang xử lý
        // Vì không hiện Modal kết quả nên cần có cái gì đó báo user biết là đang chạy
        const $btn = $(this);
        const originalText = $btn.text();
        
        if($(".loader-wrapper").length) {
            $(".loader-wrapper").fadeIn();
        } else {
            $btn.text("Đang tạo ảnh...").prop("disabled", true);
        }

        const node = document.getElementById("frame-wrapper");

        // 2. Tính toán Scale (Để ảnh nét)
        const desiredWidth = 2000; 
        const currentWidth = node.offsetWidth;
        let dynamicScale = desiredWidth / currentWidth;
        if (dynamicScale < 2) dynamicScale = 2;

        // 3. Kiểm tra thiết bị & Cấu hình độ lệch (Giữ nguyên logic cũ của bạn)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        // --- CHỈNH ĐỘ LỆCH Ở ĐÂY ---
        const offsetPC = "-20px";      // PC: Kéo lên 20px
        const offsetMobile = "-10px";  // Mobile: Kéo lên 10px
        const finalOffset = isMobile ? offsetMobile : offsetPC;

        html2canvas(node, {
            scale: dynamicScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            // Kỹ thuật sửa vị trí chữ
            onclone: (clonedDoc) => {
                const textElements = clonedDoc.querySelectorAll('.name-content, .title-content, .message-content');
                textElements.forEach(el => {
                    // Tắt tự phóng to chữ của iPhone
                    el.style.webkitTextSizeAdjust = "100%"; 
                    
                    // Reset thuộc tính
                    el.style.lineHeight = "1.2"; 
                    el.style.display = "inline-block"; 
                    el.style.position = "relative";
                    el.style.margin = "0"; 
                    
                    // Áp dụng độ lệch
                    el.style.transform = `translateY(${finalOffset})`;
                    el.style.fontFamily = getComputedStyle(el).fontFamily;
                });
            }
        }).then(canvas => {
            // 4. Xử lý Tải Xuống Ngay Lập Tức
            const finalImgDataUrl = canvas.toDataURL("image/png", 1.0);

            // Tạo một thẻ A ảo để kích hoạt tải xuống
            const link = document.createElement('a');
            link.href = finalImgDataUrl;
            link.download = 'Kyvongdaihoi.png'; // Tên file khi tải về
            document.body.appendChild(link);
            link.click(); // Kích hoạt click
            document.body.removeChild(link); // Xóa thẻ A sau khi click

            // 5. Kết thúc, ẩn loading
            if($(".loader-wrapper").length) {
                $(".loader-wrapper").fadeOut();
            } else {
                $btn.text(originalText).prop("disabled", false);
            }

        }).catch(err => {
            console.error("Lỗi:", err);
            alert("Có lỗi khi tạo ảnh. Vui lòng thử lại!");
            if($(".loader-wrapper").length) {
                $(".loader-wrapper").fadeOut();
            } else {
                $btn.text(originalText).prop("disabled", false);
            }
        });
    });
    // Đóng Modal Kết quả khi bấm nút Đóng
    $closeResultBtn.on("click", function() {
        $resultModal.fadeOut();
    });
    
    // Đóng Modal Kết quả khi bấm ra ngoài
    $(window).on("click", function (event) {
        if (event.target === $resultModal[0]) {
            $resultModal.fadeOut();
        }
    });
});

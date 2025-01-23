const wheel = {
  vouchers: [],
  spinning: false,
  wrapElm: null,
  repeatTimes: 50,
  timeSpin: 6000,
  phoneRegex: /^(0)(3[2-9]|5[6-9]|7[0-7]|8[0-9]|9[0-9])([0-9]{7})$/,
  customerPhone: '',

  init(voucherData, spinQuantity) {
    this.vouchers      = Object.values(voucherData);
    this.wrapElm       = $(".wheel .voucher-wrap");
    this.spinning      = false;
    this.spinQuantity  = spinQuantity || 1;
    this.bindEvents();
  },

  bindEvents () {
    this.render();
    $("#btn-spin").on("click", () => {
      this.processSpin();
    });

    $(".popup-close").on("click", () => {
      $(".popup").removeClass("active");
    });

    $("#btn-phone").on("click", () => {
      this.processGetPhone();
    });
  },

  processGetPhone() {
    this.customerPhone = $(".popup-input input").val();
    console.log(this.customerPhone);
    if(!this.customerPhone.match(this.phoneRegex)) {
      alert("Số điện thoại không hợp lệ!");
      return;
    }
    $(".popup-phone").removeClass("active");
    this.processSpin();
  },

  processSpin() {
    
    if (this.spinQuantity === 0) {
      alert("Bạn đã sử dụng hết lượt quay!");
      return;
    }

    if(!this.customerPhone) {
      $(".popup-phone").addClass("active");
      return;
    }

    if (!this.spinning) this.spin();
  },


  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  render() {
    let repeatedVouchers = [];
    for (let i = 0; i < this.repeatTimes; i++) {
      repeatedVouchers = repeatedVouchers.concat(this.shuffle([...this.vouchers]));
    }
    
    const html = repeatedVouchers
      .map((voucher) => `
        <div class="voucher-item" data-value="${voucher.value}" data-name="${voucher.name}">
          <img src="${voucher.image}" alt="${voucher.name}">
        </div>`)
      .join("");

    this.wrapElm.html(html);
  },

  getRandomVoucher() {
    const totalRate = this.vouchers.reduce((sum, voucher) => sum + voucher.rate, 0);
    let random = Math.random() * totalRate;
    return this.vouchers.find((voucher) => (random -= voucher.rate) < 0) || this.vouchers[0];
  },

  async spin() {
    if (this.spinning) {
      // Nếu đang quay 
      return;
    };
    this.spinning = true;
    $("#btn-spin").prop("disabled", true);

    // Phát âm thanh quay
    $("#audio-spin")[0].play();
    $("#audio-roller")[0].play();

    // 1. Xác định voucher
    const winningVoucher = this.getRandomVoucher();
    const itemHeight = $(".voucher-item").first().outerHeight();

    // 2. Tìm vị trí voucher trong list
    const allItems    = $(".voucher-item");

    const targetItems = allItems.filter(function() {
      return $(this).data("value") === winningVoucher.value;
    });

    // 3. Chọn một vị trí target nằm trong khoảng giữa của danh sách
    const middleStart   = Math.floor(allItems.length / 3);
    const middleEnd     = Math.floor(allItems.length * 2 / 3);
    const targetItem    = targetItems.filter(function(idx) {
      const position    = $(targetItems[idx]).index();
      return position >= middleStart && position <= middleEnd;
    }).first();

    if (targetItem.length === 0) {
      console.error("Không tìm thấy vị trí phù hợp!");
      this.spinning = false;
      $("#btn-spin").prop("disabled", false);
      return;
    }

    // 4. Tính toán vị trí cuối cùng để voucher trúng thưởng dừng ở vị trí đầu tiên
    const targetIndex = targetItem.index();
    const finalPosition = targetIndex * itemHeight;

    // 5. Reset vị trí và thực hiện animation
    this.wrapElm.css({ transition: "none", transform: "translateY(0)" });
    this.wrapElm[0].offsetHeight;

    // 6. Animation quay
    this.wrapElm.css({
      transition: `transform ${this.timeSpin / 1000}s cubic-bezier(0.1, 0.7, 0.2, 1)`,
      transform: `translateY(-${finalPosition}px)`
    });

    // 7. Đợi animation hoàn thành
    await new Promise(resolve => setTimeout(resolve, this.timeSpin));

    // 8. Giữ nguyên vị trí cuối
    this.wrapElm.css({ 
      transition: "none", 
      transform: `translateY(-${finalPosition}px)` 
    });

    this.spinning = false;
    $("#btn-spin").prop("disabled", false);

    // 9. Trừ số lần quay
    this.spinQuantity--;
    console.log(this.spinQuantity);

    $("#audio-roller")[0].pause();
    // 10. Hiển thị kết quả
    this.showResult(winningVoucher);
  },

  showResult(winningVoucher) {
    // Dừng âm thanh quay trước khi phát âm thanh thắng
    $("#audio-spin")[0].pause();
    $("#audio-spin")[0].currentTime = 0; // Reset âm thanh quay
    $("#audio-roller")[0].pause(); // Dừng âm thanh roller

    $("#audio-win")[0].play(); // Phát âm thanh thắng
    $("#popup-result").addClass("active");
    $(".popup-result__voucher").html(`<img src="${winningVoucher.image}" alt="${winningVoucher.name}">`);
  }
};
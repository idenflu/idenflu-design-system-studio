(() => {
  "use strict";

  const tree = document.querySelector(".demo-tree");
  tree.addEventListener("click", (event) => {
    const item = event.target.closest(".tree-item");
    if (!item) return;
    tree.querySelectorAll(".tree-item").forEach((node) => {
      node.classList.toggle("is-selected", node === item);
      if (node === item) node.setAttribute("aria-current", "true");
      else node.removeAttribute("aria-current");
    });
    document.querySelector("#tree-feedback").textContent = `선택: ${item.textContent.trim()}`;
  });

  document.querySelector("#view-chips").addEventListener("click", (event) => {
    const chip = event.target.closest('.chip[aria-pressed]');
    if (chip) chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
  });
  const sizeExamples = document.querySelector("#chip-size-examples");
  const initialSizeExamples = sizeExamples.innerHTML;
  const sizeFeedback = document.querySelector("#chip-size-feedback");
  const resetSizes = document.querySelector("#reset-size-chips");
  sizeExamples.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-size-chip]");
    if (!chip) return;
    const next = chip.previousElementSibling || resetSizes;
    sizeFeedback.textContent = `${chip.getAttribute("aria-label")}했습니다.`;
    chip.remove();
    next.focus();
  });
  resetSizes.addEventListener("click", () => {
    sizeExamples.innerHTML = initialSizeExamples;
    sizeFeedback.textContent = "사이즈 예시를 초기화했습니다.";
  });
  const removable = document.querySelector("#removable-chips");
  const initialChips = removable.innerHTML;
  const chipFeedback = document.querySelector("#chip-feedback");
  removable.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip--removable");
    if (!chip) return;
    const next = chip.nextElementSibling || chip.previousElementSibling || document.querySelector("#reset-chips");
    chipFeedback.textContent = `${chip.textContent.trim()} 항목을 제거했습니다.`;
    chip.remove();
    next.focus();
  });
  document.querySelector("#reset-chips").addEventListener("click", () => {
    removable.innerHTML = initialChips;
    chipFeedback.textContent = "항목을 초기화했습니다.";
  });

  document.querySelector(".selectable-list").addEventListener("click", (event) => {
    const selected = event.target.closest("button[aria-pressed]");
    if (!selected) return;
    document.querySelectorAll(".selectable-list button[aria-pressed]").forEach((button) => {
      const active = button === selected;
      button.setAttribute("aria-pressed", String(active));
      button.querySelector(".list-state").textContent = active ? "선택됨" : "선택";
    });
  });

  function connectRange(id, update) {
    const range = document.querySelector(id);
    const refresh = () => {
      const percent = (Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min)) * 100;
      range.style.setProperty("--fill", `${percent}%`);
      const thumbWidth = parseFloat(getComputedStyle(range).getPropertyValue("--range-thumb-width")) || 18;
      const offset = thumbWidth * (0.5 - percent / 100);
      range.style.setProperty("--fill-position", `calc(${percent}% + ${offset}px)`);
      update(range.value);
    };
    range.addEventListener("input", refresh);
    refresh();
  }
  connectRange("#progress-slider", (value) => {
    document.querySelector("#demo-progress").value = value;
    document.querySelector("#progress-value").textContent = `${value}%`;
  });
  connectRange("#volume-slider", (value) => {
    document.querySelector("#volume-value").textContent = `${value}%`;
    document.querySelector("#volume-slider").setAttribute("aria-valuetext", `${value}%`);
  });
  connectRange("#step-slider", (value) => {
    document.querySelector("#step-value").textContent = `${value}%`;
    document.querySelector("#step-slider").setAttribute("aria-valuetext", `${value}%`);
  });
  connectRange("#disabled-slider", () => {});

  const slides = [
    ["명확한 위계", "중요한 정보를 먼저 보여주고, 나머지는 자연스럽게 이어갑니다."],
    ["일관된 구성", "같은 역할을 하는 요소는 같은 규칙과 표현을 사용합니다."],
    ["편안한 사용", "필요한 동작을 쉽게 찾고 키보드로도 사용할 수 있게 합니다."],
  ];
  let slideIndex = 0;
  const previousSlide = document.querySelector("#slide-prev");
  const nextSlide = document.querySelector("#slide-next");
  function renderSlide() {
    document.querySelector("#slide-index").textContent = `${String(slideIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    document.querySelector("#slide-title").textContent = slides[slideIndex][0];
    document.querySelector("#slide-description").textContent = slides[slideIndex][1];
    previousSlide.disabled = slideIndex === 0;
    nextSlide.disabled = slideIndex === slides.length - 1;
  }
  previousSlide.addEventListener("click", () => { slideIndex -= 1; renderSlide(); });
  nextSlide.addEventListener("click", () => { slideIndex += 1; renderSlide(); });

})();

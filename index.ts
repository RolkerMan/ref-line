import RefLine from "./use-ref-line";

let boxes = Array.from(document.querySelectorAll(".box")) as HTMLElement[];
let refLine = new RefLine({
  // canvasNode: document.getElementById("canvas"),
  canvasNode: document.body,
  scale: 1,
});

// el = document.querySelector('.box');
// when the user clicks down on the element
boxes.forEach((el) => {
  let newPosX = 0,
    newPosY = 0,
    startPosX = 0,
    startPosY = 0;

  el.addEventListener("mousedown", function (e: MouseEvent) {
    e.preventDefault();

    refLine.setAllCheckNodes(boxes);

    // get the starting position of the cursor
    startPosX = e.clientX;
    startPosY = e.clientY;

    document.addEventListener("mousemove", mouseMove);

    document.addEventListener("mouseup", function (e: MouseEvent) {
      const el = e.target as HTMLElement;

      document.removeEventListener("mousemove", mouseMove);
    });
  });

  function mouseMove(e: MouseEvent) {
    const el = e.target as HTMLElement;
    if (el === document.body) return;
    console.log("move...", el);
    refLine.check(el);

    // calculate the new position
    newPosX = startPosX - e.clientX;
    newPosY = startPosY - e.clientY;

    // with each move we also want to update the start X and Y
    startPosX = e.clientX;
    startPosY = e.clientY;

    // set the element's new position:
    el.style.top = el.offsetTop - newPosY + "px";
    el.style.left = el.offsetLeft - newPosX + "px";
  }
});

// import { EventTypeEnum } from "@/constants";
// import { ComponentDragEventMessage } from "@/types/events";
// import { getPxNumber } from "@/utils/common";
// import visionCore from "@/vision-core";
// import { computed, onMounted, Ref, unref } from "vue";

const getPxNumber = (str: string) => parseFloat(str);

type LineElement = HTMLElement & {
  show: (this: LineElement) => void;
  hide: (this: LineElement) => void;
  isShow: (this: LineElement) => void;
  _lineDirection: EnumLineDirection;
};
enum EnumLineDirection {
  horizontal = "horizontal",
  vertical = "vertical",
}
// type LineKey = 'xt' | 'xc' | 'xb' | 'yl' | 'yc' | 'yr';
// enum EnumLineKey {
//   xtt = "xtt",
//   xtb = "xtb",
//   xc = "xc",
//   xbt = "xbt",
//   xbb = "xbb",
//   yll = "yll",
//   ylr = "ylr",
//   yc = "yc",
//   yrl = "yrl",
//   yrr = "yrr",
// }
enum EnumLineKey {
  xt = "xt",
  xc = "xc",
  xb = "xb",
  yl = "yl",
  yc = "yc",
  yr = "yr",
}
type LineType = LineElement | null;

type GetRect = (elem: HTMLElement) => {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};

type Condition = {
  /** 是否相近 */
  isNearly: boolean;
  /** 如果相近，需要显示的线条 */
  lineNode: LineElement | null;
  lineValue: number;
  lineOffset: {
    start: number;
    end: number;
  } | null;
  dragValue: number;
};

// const lines: Record<EnumLineKey, LineType> = {
//   xtt: null,
//   xtb: null,
//   xc: null,
//   xbt: null,
//   xbb: null,
//   yll: null,
//   ylr: null,
//   yc: null,
//   yrl: null,
//   yrr: null,
// };
const lines: Record<EnumLineKey, LineType> = {
  xt: null,
  xc: null,
  xb: null,
  yl: null,
  yc: null,
  yr: null,
};

/**
 * TODO: 这个可以从外部传入
 * 获取元素在画布上的矩形信息
 */
const getRect: GetRect = function (elem) {
  return elem.getBoundingClientRect();
  // const style = getComputedStyle(elem);

  // const top = getPxNumber(style.top);
  // const left = getPxNumber(style.left);
  // const width = getPxNumber(style.width);
  // const height = getPxNumber(style.height);

  // return {
  //   top,
  //   left,
  //   width,
  //   height,
  //   bottom: top + height,
  //   right: left + width,
  // };
};

class RefLine {
  private static defaultOption: {
    gap: number;
    scale: number;
    canvasNode?: HTMLElement;
    lineColor?: string;
    lineStyle?: CSSStyleDeclaration;
  } = {
    gap: 3,
    lineColor: "#F53F3F",
    scale: 1,
  };
  private options = RefLine.defaultOption;

  constructor(options: Partial<typeof RefLine.defaultOption> = {}) {
    this.options = Object.assign(RefLine.defaultOption, options);
    this.initLines();
  }
  updateOptions(options: Partial<typeof RefLine.defaultOption> = {}) {
    this.options = Object.assign(this.options, options);
  }

  private isNearly(dragValue: number, targetValue: number, showLog?: boolean) {
    if (showLog) {
      // console.log('计算 isNearly：');
      // console.log('🚀 ~ dragValue, targetValue', dragValue, targetValue);
      // console.log('🚀 ~ Math.abs(dragValue - targetValue)', Math.abs(dragValue - targetValue));
      // console.log('🚀 ~  this.options.gap', this.options.gap);
    }
    return Math.abs(dragValue - targetValue) <= this.options.gap;
  }
  private allCheckNodes: HTMLElement[] = [];

  private getCanvasNode() {
    const result = this.options.canvasNode; // unref(this.options.canvasNode);
    return result as HTMLElement;
  }

  /**
   * @param chkNodes 选择器 或者 原生node集合
   */
  setAllCheckNodes(chkNodes: string | HTMLElement[]) {
    const checkNodes = (
      typeof chkNodes === "string"
        ? document.querySelectorAll(chkNodes)
        : chkNodes
    ) as HTMLElement[];
    const canvas = this.getCanvasNode();

    this.allCheckNodes = [...Array.from(checkNodes), canvas];
  }
  /**
   * @param dragNode 拖拽元素的原生node
   */
  check(dragNode: HTMLElement) {
    // const dragRect = dragNode.getBoundingClientRect();
    const dragRect = getRect(dragNode);

    this.uncheck();

    // TODO: 变量维护三横三纵线段位置（最left、right 和 最top、bottom）
    const showLineMap = new Map<
      Condition["lineNode"],
      { start: number; end: number }
    >();
    this.allCheckNodes.forEach((item) => {
      item.classList.remove("ref-line-active");

      if (item === dragNode) return;
      // const { top, height, bottom, left, width, right } = item.getBoundingClientRect();
      const { top, height, bottom, left, width, right } = getRect(
        item as HTMLElement
      );
      const dragWidthHalf = dragRect.width / 2;
      const itemWidthHalf = width / 2;
      const dragHeightHalf = dragRect.height / 2;
      const itemHeightHalf = height / 2;
      const horizontalOffset = {
        start: Math.min(dragRect.left, left),
        end: Math.max(dragRect.right, right),
      };
      const verticalOffset = {
        start: Math.min(dragRect.top, top),
        end: Math.max(dragRect.bottom, bottom),
      };

      // 每个节点分别计算对齐的情况
      const conditions: {
        /** 水平线段集合 */
        top: Condition[];
        /** 垂直线段集合 */
        left: Condition[];
      } = {
        top: [
          // xt-top
          {
            isNearly: this.isNearly(dragRect.top, top),
            lineNode: lines.xt,
            lineValue: top,
            dragValue: top,
            lineOffset: horizontalOffset,
          },
          // xt-bottom
          {
            isNearly: (() => {
              const result = this.isNearly(dragRect.bottom, top, true);
              return result;
            })(),
            lineNode: lines.xb,
            lineValue: top,
            dragValue: top - dragRect.height,
            lineOffset: horizontalOffset,
          },
          // xc
          {
            isNearly: this.isNearly(
              dragRect.top + dragHeightHalf,
              top + itemHeightHalf
            ),
            lineNode: lines.xc,
            lineValue: top + itemHeightHalf,
            dragValue: top + itemHeightHalf - dragHeightHalf,
            lineOffset: horizontalOffset,
          },
          // xb-top
          {
            isNearly: this.isNearly(dragRect.bottom, bottom),
            lineNode: lines.xb,
            lineValue: bottom,
            dragValue: bottom - dragRect.height,
            lineOffset: horizontalOffset,
          },
          // xb-bottom
          {
            isNearly: this.isNearly(dragRect.top, bottom),
            lineNode: lines.xt,
            lineValue: bottom,
            dragValue: bottom,
            lineOffset: horizontalOffset,
          },
        ],

        left: [
          // yl-left 拖拽节点的左边，比较节点的左边
          {
            isNearly: (() => {
              const result = this.isNearly(dragRect.left, left);
              // if (result) {
              //   console.log('dragRect', dragRect);
              //   console.log('item', item);
              //   console.log('🚀 ~ dragRect.bottom, bottom', dragRect.bottom, bottom);
              //   console.log('🚀 ~ dragRect.top, top', dragRect.top, top);
              //   console.log('verticalOffset', verticalOffset);
              // }
              return result;
            })(),
            lineNode: lines.yl,
            lineValue: left,
            dragValue: left,
            lineOffset: verticalOffset,
          },
          // yl-right 拖拽节点的右边，比较节点的左边
          {
            isNearly: (() => {
              const result = this.isNearly(dragRect.right, left);
              if (result) {
                console.log("isNearly dragRect.right, left");
                console.log(dragRect);
                console.log(item);
              }
              return result;
            })(),
            lineNode: lines.yr,
            lineValue: left,
            dragValue: left - dragRect.width,
            lineOffset: verticalOffset,
          },
          // yc
          {
            isNearly: this.isNearly(
              dragRect.left + dragWidthHalf,
              left + itemWidthHalf
            ),
            lineNode: lines.yc,
            lineValue: left + itemWidthHalf,
            dragValue: left + itemWidthHalf - dragWidthHalf,
            lineOffset: verticalOffset,
          },
          // yr-left
          {
            isNearly: (() => {
              const result = this.isNearly(dragRect.right, right);
              if (result) {
                console.log("isNearly dragRect.right, right");
                console.log(dragRect);
                console.log(item);
              }
              return result;
            })(),
            lineNode: lines.yr,
            lineValue: right,
            dragValue: right - dragRect.width,
            lineOffset: verticalOffset,
          },
          // yr-right
          {
            isNearly: this.isNearly(dragRect.left, right),
            lineNode: lines.yl,
            lineValue: right,
            dragValue: right,
            lineOffset: verticalOffset,
          },
        ],
      };

      for (const k in conditions) {
        const key = k as keyof typeof conditions;
        // 遍历符合的条件并处理
        conditions[key].forEach(
          ({ dragValue, lineNode, lineValue, isNearly, lineOffset }) => {
            if (!isNearly) return;

            item.classList.add("ref-line-active");
            // dragNode.style[key] = `${dragValue}px`;

            if (lineNode) {
              lineNode.style[key] = `${lineValue}px`;

              if (showLineMap.has(lineNode) && lineOffset) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const old = showLineMap.get(lineNode)!;
                showLineMap.set(lineNode, {
                  // start: old.start < lineOffset.start ? old.start : lineOffset.start,
                  // end: old.end > lineOffset.end ? old.end : lineOffset.end
                  start: Math.min(lineOffset.start, old.start),
                  end: Math.max(lineOffset.end, old.end),
                  // endPoint: Math.max(lineOffset.endPoint, old.endPoint)
                });
              } else {
                lineOffset && showLineMap.set(lineNode, lineOffset);
              }
            }
          }
        );
      }
    });

    console.log("showLineNodes for each-------");
    showLineMap.forEach((offset, line) => {
      console.log("line:", line, offset);
      if (line) {
        const { start, end }: typeof offset = offset;
        if (line._lineDirection === EnumLineDirection.horizontal) {
          line.style.left = start + "px";
          // TODO: 优化，不要用 calc 会快点
          line.style.right = `calc(100% - ${end}px)`;
        } else {
          line.style.top = start + "px";
          // TODO: 优化，不要用 calc 会快点
          line.style.bottom = `calc(100% - ${end}px)`;
        }
        // TODO: 去除同一个 top 或 left 值上重叠的线段
        line.show();
      }
    });
  }

  uncheck() {
    Object.values(lines).forEach((item) => item?.hide());
    Array.from(document.querySelectorAll(".ref-line-active")).forEach((item) =>
      item.classList.remove("ref-line-active")
    );
  }

  initLines() {
    const canvas = this.getCanvasNode();

    // 置入参考线
    for (const p in lines) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const node = (lines[p as EnumLineKey] = document.createElement(
        "div"
      ) as unknown as LineElement)!;

      node.classList.add("ref-line", p);
      const linePos =
        p[0] === "x"
          ? // 水平线
            "left:0;right:0;transform: translateY(-50%);"
          : // 竖直线
            "top:0;bottom:0;transform: translateX(-50%);";

      node.style.cssText = `display:none;${linePos}position:absolute;border:1px dashed ${this.options.lineColor};z-index:999999999;`;

      // 挂上一些辅助方法
      node.show = function () {
        this.style.display = "block";
      };
      node.hide = function () {
        this.style.display = "none";
      };
      node.isShow = function () {
        return this.style.display !== "none";
      };
      node._lineDirection =
        p[0] === "x"
          ? EnumLineDirection.horizontal
          : EnumLineDirection.vertical;

      // 将所有辅助线插入画布节点
      canvas.appendChild(node);
    }
  }
}

export default RefLine;
// // 创建时：实例化单例对象
// // 更新时：传入 scale、gap 等其他 options
// export default function ({
//   canvasNode,
//   chkNodes,
//   scale,
// }: // transformScale
// {
//   canvasNode: HTMLElement | Ref<HTMLElement | null>;
//   chkNodes: string | HTMLElement[];
//   lineColor?: string;
//   scale: number;
//   transformScale: Ref<number>;
// }) {
//   // const realScale = computed(() => {
//   //   return transformScale.value;
//   // });

//   let refLine: RefLine;
//   // onMounted(() => {
//   refLine = new RefLine({ canvasNode: canvasNode, scale });

//   visionCore.on(EventTypeEnum.COMPONENT_DRAGSTART, (event) => {
//     console.log("EventTypeEnum.COMPONENT_DRAGSTART", event);
//     // 开始时先 update options
//     refLine.updateOptions({
//       // scale: realScale.value
//     });
//     // 开始拖拽前先缓存下所有需要对比的节点
//     refLine.setAllCheckNodes(chkNodes);
//   });

//   const fn = (event: ComponentDragEventMessage) => {
//     refLine.check(event.dragEvent?.target as HTMLElement);
//   };
//   const checkDebounce = fn; // debounce(fn, 1000);
//   visionCore.on(EventTypeEnum.COMPONENT_DRAGMOVE, (event) => {
//     // 检查当前拖动节点和需要对比的节点是否有吸附或参考线
//     // console.log('EventTypeEnum.COMPONENT_DRAGMOVE', event);
//     // console.log('TODO -- 执行 check() 函数');
//     checkDebounce(event);
//   });
//   // });

//   return {};
// }

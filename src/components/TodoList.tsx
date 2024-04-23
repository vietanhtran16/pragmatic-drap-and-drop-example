import { CSSProperties, FC, useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import invariant from "tiny-invariant";
import React from "react";
import {
  attachClosestEdge,
  extractClosestEdge,
  Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { DragHandleButton } from "@atlaskit/pragmatic-drag-and-drop-react-accessibility/drag-handle-button";

type TodoItem = {
  id: number;
  label: string;
  index: number;
};

function reorder(
  todoItems: Array<Omit<TodoItem, "index">>,
  idOfItemToMove: number,
  afterId: number | undefined
) {
  const copy = [...todoItems];
  const itemToMove = copy.find(({ id }) => id === idOfItemToMove);
  if (!itemToMove) return copy;
  const withoutItemToMove = copy.filter(({ id }) => id !== idOfItemToMove);

  if (afterId) {
    const indexOfAfterItem = withoutItemToMove.findIndex(
      ({ id }) => id === afterId
    );
    const newIndexOfItemToMove = indexOfAfterItem + 1;
    withoutItemToMove.splice(newIndexOfItemToMove, 0, itemToMove);
    return withoutItemToMove;
  }

  return [itemToMove, ...withoutItemToMove];
}

const ListItem: FC<TodoItem> = (props) => {
  const { id, label, index } = props;
  const elementRef = useRef(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const [dragState, setDragState] = useState<boolean>(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const defaultStyles: CSSProperties = {
    position: "relative",
    paddingBottom: "8px",
    listStyle: "none",
    display: "flex",
  };

  useEffect(() => {
    const element = elementRef.current;
    invariant(element);
    invariant(dragHandleRef.current);

    return combine(
      draggable({
        element,
        onDragStart: () => setDragState(true),
        onDrop: () => setDragState(false),
        getInitialData: () => props,
        dragHandle: dragHandleRef.current,
      }),
      dropTargetForElements({
        element,
        getData({ input }) {
          return attachClosestEdge(props, {
            element,
            input,
            allowedEdges: ["top", "bottom"],
          });
        },
        onDrop: () => setClosestEdge(null),
        onDragLeave: () => setClosestEdge(null),
        onDrag({ self, source }) {
          const isSource = source.element === element;
          if (isSource) {
            setClosestEdge(null);
            return;
          }

          const closestEdge = extractClosestEdge(self.data);

          const sourceIndex = source.data.index;
          invariant(typeof sourceIndex === "number");

          const isItemBeforeSource = index === sourceIndex - 1;
          const isItemAfterSource = index === sourceIndex + 1;

          const isDropIndicatorHidden =
            (isItemBeforeSource && closestEdge === "bottom") ||
            (isItemAfterSource && closestEdge === "top");

          if (isDropIndicatorHidden) {
            setClosestEdge(null);
            return;
          }

          setClosestEdge(closestEdge);
        },
      })
    );
  }, [index, props]);

  return (
    <li
      key={id}
      ref={elementRef}
      style={
        dragState
          ? { opacity: dragState ? 0.5 : 1, ...defaultStyles }
          : defaultStyles
      }
    >
      <DragHandleButton label="Reorder" ref={dragHandleRef} />
      {`${id} - ${label}`}
      {closestEdge && <DropIndicator edge={closestEdge} />}
    </li>
  );
};

export const TodoList = () => {
  const [todoItems, setTodoItems] = useState<Array<Omit<TodoItem, "index">>>([
    { id: 1, label: "Wake up" },
    { id: 2, label: "Brush teeth" },
    { id: 3, label: "Breakfast" },
    { id: 4, label: "Work" },
    { id: 5, label: "Cycle" },
  ]);

  useEffect(() => {
    return monitorForElements({
      onDrop({ location, source }) {
        const target = location.current.dropTargets[0];
        if (!target) {
          return;
        }

        const sourceData = source.data as TodoItem;
        const targetData = target.data as TodoItem;

        const indexOfTarget = todoItems.findIndex(
          (item) => item.id === targetData.id
        );
        if (indexOfTarget < 0) {
          return;
        }

        const closestEdgeOfTarget = extractClosestEdge(targetData);

        const indexOfAfterItemIndex = todoItems.findIndex(
          ({ id }) => id === targetData.id
        );

        const afterItemId =
          closestEdgeOfTarget === "bottom"
            ? targetData.id
            : todoItems[indexOfAfterItemIndex - 1]?.id;

        setTodoItems(reorder(todoItems, sourceData.id, afterItemId));
      },
    });
  }, [todoItems]);

  return (
    <ul>
      {todoItems.map((item, index) => (
        <ListItem key={item.id} {...item} index={index} />
      ))}
    </ul>
  );
};

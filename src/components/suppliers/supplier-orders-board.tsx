"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { GripVertical, PackageCheck } from "lucide-react";
import { AddSupplierOrderDialog } from "@/components/suppliers/add-supplier-order-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/format";
import { todayISOInTimeZone } from "@/lib/date";
import type { ProductOption } from "@/lib/inventory";
import {
  calculateOutstandingCents,
  deriveSupplierOrderColumn,
  type NewSupplierOrderInput,
  type SupplierOrder,
  type SupplierOrderColumn,
  type SupplierOrderStatus,
} from "@/lib/suppliers/orders";
import type { PartyRow } from "@/lib/suppliers/types";

const COLUMNS: Array<{
  id: SupplierOrderStatus;
  title: string;
}> = [
  { id: "ordered", title: "Ordered" },
  { id: "received", title: "Received" },
];

const todayInNepal = () => todayISOInTimeZone("Asia/Kathmandu");

interface SupplierOrdersBoardProps {
  orders: SupplierOrder[];
  suppliers: PartyRow[];
  products: ProductOption[];
  canManage: boolean;
  busy: boolean;
  onCreate: (input: NewSupplierOrderInput) => Promise<void>;
  onMove: (order: SupplierOrder, target: SupplierOrderColumn) => Promise<void>;
  onRecordPayment: (order: SupplierOrder) => void;
}

function isOverdue(order: SupplierOrder): boolean {
  return (
    calculateOutstandingCents(order.totalCents, order.paidCents) > 0 &&
    order.dueDate < todayInNepal()
  );
}

function amountFor(order: SupplierOrder): number {
  return order.totalCents;
}

function SupplierOrderCard({
  order,
  column,
  busy,
  canManage,
  onOpen,
  onMove,
}: {
  order: SupplierOrder;
  column: SupplierOrderStatus;
  busy: boolean;
  canManage: boolean;
  onOpen: () => void;
  onMove: (target: SupplierOrderColumn) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: order.id, disabled: busy || !canManage });
  const outstanding = calculateOutstandingCents(
    order.totalCents,
    order.paidCents,
  );
  const orderColumn = deriveSupplierOrderColumn(order);
  const progress =
    order.totalCents === 0
      ? 0
      : Math.min(100, Math.round((order.paidCents / order.totalCents) * 100));

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
          : undefined,
        opacity: isDragging ? 0.45 : 1,
      }}
      className="cursor-pointer"
      onClick={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest("button, select, a")
        ) {
          return;
        }
        onOpen();
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={onOpen}
          >
            <span className="block truncate text-sm font-semibold">
              {order.supplierName}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Order {order.id.slice(0, 8)}
            </span>
          </button>
          <Badge
            variant={orderColumn === "paid" ? "secondary" : "outline"}
            className="shrink-0 capitalize"
          >
            {orderColumn}
          </Badge>
        </div>
        {canManage ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag order ${order.id.slice(0, 8)}`}
            className="inline-flex size-8 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={busy}
          >
            <GripVertical aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <button
          type="button"
          className="block w-full truncate text-left text-sm text-muted-foreground hover:text-foreground"
          onClick={onOpen}
          title={order.items}
        >
          {order.items}
          {order.quantity !== null
            ? ` · Qty ${formatQuantity(order.quantity)}`
            : ""}
        </button>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="mt-0.5 font-medium">
              {formatCurrency(order.totalCents / 100)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid</p>
            <p className="mt-0.5 font-medium">
              {formatCurrency(order.paidCents / 100)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Outstanding</p>
            <p className="mt-0.5 font-medium">
              {formatCurrency(outstanding / 100)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Order date</p>
            <p className="mt-0.5">{formatDate(order.orderDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Due date</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1">
              {formatDate(order.dueDate)}
              {isOverdue(order) ? (
                <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                  Overdue
                </Badge>
              ) : null}
            </p>
          </div>
        </div>
        {orderColumn === "credit" ? (
          <div className="space-y-1">
            <div
              role="progressbar"
              aria-label={`Payment progress for order ${order.id.slice(0, 8)}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-[11px] text-muted-foreground">
              {formatCurrency(order.paidCents / 100)} paid · {progress}%
            </p>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2 border-t pt-2">
          {column === "received" && outstanding > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onOpen()}
            >
              Details
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {column === "ordered" ? "Awaiting receipt" : ""}
            </span>
          )}
          {canManage ? (
            <>
              <label className="sr-only" htmlFor={`move-order-${order.id}`}>
                Move order {order.id.slice(0, 8)} to
              </label>
              <select
                id={`move-order-${order.id}`}
                aria-label={`Move order ${order.id.slice(0, 8)} to`}
                className="h-8 max-w-36 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value=""
                disabled={busy}
                onChange={(event) => {
                  if (event.target.value) {
                    onMove(event.target.value as SupplierOrderColumn);
                  }
                }}
              >
                <option value="">Move to…</option>
                {COLUMNS.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.title}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderLane({
  id,
  title,
  orders,
  busy,
  canManage,
  onOpen,
  onMove,
}: {
  id: SupplierOrderStatus;
  title: string;
  orders: SupplierOrder[];
  busy: boolean;
  canManage: boolean;
  onOpen: (order: SupplierOrder) => void;
  onMove: (order: SupplierOrder, target: SupplierOrderColumn) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const totalCents = orders.reduce(
    (sum, order) => sum + amountFor(order),
    0,
  );

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} orders`}
      className={`w-[min(85vw,21rem)] shrink-0 rounded-xl border p-3 transition-colors sm:w-72 ${
        isOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      }`}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold">
          {title} · {orders.length} · {formatCurrency(totalCents / 100)}
        </h3>
      </div>
      <div className="min-h-36 space-y-3">
        {orders.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            Drop orders here
          </p>
        ) : (
          orders.map((order) => (
            <SupplierOrderCard
              key={order.id}
              order={order}
              column={id}
              busy={busy}
              canManage={canManage}
              onOpen={() => onOpen(order)}
              onMove={(target) => onMove(order, target)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onRecordPayment,
  busy,
}: {
  order: SupplierOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: (order: SupplierOrder) => void;
  busy: boolean;
}) {
  if (!order) return null;
  const outstanding = calculateOutstandingCents(
    order.totalCents,
    order.paidCents,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Supplier order · {order.id.slice(0, 8)}</DialogTitle>
          <DialogDescription>
            {order.supplierName} · {order.category}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium">Items / description</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {order.items}
            </p>
            {order.quantity !== null ? (
              <p className="mt-2 text-muted-foreground">
                Quantity: {formatQuantity(order.quantity)}
              </p>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-medium">
                {formatCurrency(order.totalCents / 100)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Paid</dt>
              <dd className="font-medium">
                {formatCurrency(order.paidCents / 100)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Outstanding</dt>
              <dd className="font-medium">
                {formatCurrency(outstanding / 100)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">
                {deriveSupplierOrderColumn(order)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Order date</dt>
              <dd>{formatDate(order.orderDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Due date</dt>
              <dd className="flex flex-wrap items-center gap-1">
                {formatDate(order.dueDate)}
                {isOverdue(order) ? (
                  <Badge variant="destructive">Overdue</Badge>
                ) : null}
              </dd>
            </div>
            {order.receivedAt ? (
              <div>
                <dt className="text-muted-foreground">Received</dt>
                <dd>{formatDate(order.receivedAt)}</dd>
              </div>
            ) : null}
          </dl>
          {order.attachmentUrl ? (
            <a
              href={order.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Open order attachment
            </a>
          ) : null}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Payment history</h3>
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments recorded for this order.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {order.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span>
                      {formatDate(payment.paymentDate)} ·{" "}
                      <span className="capitalize">{payment.paymentMethod}</span>
                    </span>
                    <span className="font-medium">
                      {formatCurrency(payment.amountCents / 100)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          {order.status === "received" && outstanding > 0 ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() => onRecordPayment(order)}
            >
              Record payment
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SupplierOrdersBoard({
  orders,
  suppliers,
  products,
  canManage,
  busy,
  onCreate,
  onMove,
  onRecordPayment,
}: SupplierOrdersBoardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function move(order: SupplierOrder, target: SupplierOrderColumn) {
    void onMove(order, target);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    const order = orders.find((candidate) => candidate.id === event.active.id);
    const target = COLUMNS.find((column) => column.id === event.over?.id);
    if (order && target) move(order, target.id);
  }

  const visibleOrdersByColumn = COLUMNS.map((column) => ({
    ...column,
    orders: orders.filter(
      (order) => order.status === column.id,
    ),
  }));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Orders Board</CardTitle>
          <p className="text-sm text-muted-foreground">
            Receive orders to create payables. Received orders are tagged
            Credit or Paid based on their outstanding balance.
          </p>
        </div>
        {canManage ? (
          <AddSupplierOrderDialog
            suppliers={suppliers}
            products={products}
            busy={busy}
            onSubmit={onCreate}
          />
        ) : null}
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-10 text-center">
            <PackageCheck
              aria-hidden="true"
              className="mx-auto size-8 text-muted-foreground"
            />
            <p className="mt-3 font-medium">No orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a supplier order to start tracking deliveries and payables.
            </p>
            {suppliers.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Add a supplier before creating an order.
              </p>
            ) : null}
          </div>
        ) : (
          <DndContext
            id="supplier-orders-board"
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 overflow-x-auto pb-2 sm:gap-4">
              {visibleOrdersByColumn.map((column) => (
                <OrderLane
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  orders={column.orders}
                  busy={busy}
                  canManage={canManage}
                  onOpen={(order) => setSelectedId(order.id)}
                  onMove={move}
                />
              ))}
            </div>
          </DndContext>
        )}
      </CardContent>
      <OrderDetailDialog
        order={selectedOrder}
        open={selectedOrder !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onRecordPayment={(order) => {
          setSelectedId(null);
          onRecordPayment(order);
        }}
        busy={busy}
      />
    </Card>
  );
}

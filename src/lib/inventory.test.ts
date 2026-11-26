import { describe, expect, it } from "vitest"
import {
  calculateInventoryValue,
  calculateNewStock,
  isLowStock,
  movementDelta,
  suggestedReorderQuantity,
} from "./inventory"

describe("inventory business logic", () => {
  describe("calculateNewStock", () => {
    it("adds stock on purchase", () => {
      expect(calculateNewStock(10, "purchase", 5)).toBe(15)
    })

    it("subtracts stock on sale", () => {
      expect(calculateNewStock(10, "sale", 3)).toBe(7)
    })

    it("subtracts stock on damaged or lost", () => {
      expect(calculateNewStock(10, "damaged", 2)).toBe(8)
      expect(calculateNewStock(10, "lost", 1)).toBe(9)
    })

    it("applies signed delta on adjustment", () => {
      expect(calculateNewStock(10, "adjustment", 4)).toBe(14)
      expect(calculateNewStock(10, "adjustment", -3)).toBe(7)
    })
  })

  describe("isLowStock", () => {
    it("returns true when current_stock is <= min_stock for active products", () => {
      expect(isLowStock(5, 5, true)).toBe(true)
      expect(isLowStock(2, 5, true)).toBe(true)
      expect(isLowStock(6, 5, true)).toBe(false)
    })

    it("returns false for inactive products", () => {
      expect(isLowStock(2, 5, false)).toBe(false)
    })
  })

  describe("movementDelta", () => {
    it("returns signed deltas for regular movements", () => {
      expect(movementDelta("purchase", 4)).toBe(4)
      expect(movementDelta("sale", 4)).toBe(-4)
      expect(movementDelta("damaged", 2)).toBe(-2)
      expect(movementDelta("lost", 1)).toBe(-1)
    })

    it("reads adjustment direction from the reason prefix", () => {
      expect(movementDelta("adjustment", 3, "Increase: count fix")).toBe(3)
      expect(movementDelta("adjustment", 3, "Decrease: count fix")).toBe(-3)
    })
  })

  describe("calculateInventoryValue", () => {
    it("multiplies current_stock by purchase_price", () => {
      expect(calculateInventoryValue(10, 15.5)).toBe(155)
    })

    it("returns 0 if current_stock is 0 or negative", () => {
      expect(calculateInventoryValue(0, 10)).toBe(0)
      expect(calculateInventoryValue(-5, 10)).toBe(0)
    })
  })

  describe("suggestedReorderQuantity", () => {
    it("returns the quantity needed to reach minimum stock", () => {
      expect(suggestedReorderQuantity(2, 10)).toBe(8)
    })

    it("returns at least one unit when stock is at or below zero", () => {
      expect(suggestedReorderQuantity(0, 0)).toBe(1)
      expect(suggestedReorderQuantity(-2, 5)).toBe(7)
    })

    it("returns at least one unit when stock is already above minimum", () => {
      expect(suggestedReorderQuantity(12, 10)).toBe(1)
    })
  })
})

import { describe, expect, it } from "vitest"
import {
  calculateInventoryValue,
  calculateMarginPercent,
  calculateNewStock,
  calculateRetailValue,
  getStockStatus,
  isLowStock,
  movementDelta,
  stockLevelPercent,
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

  describe("calculateRetailValue", () => {
    it("multiplies current_stock by selling_price", () => {
      expect(calculateRetailValue(10, 25)).toBe(250)
    })

    it("returns 0 if current_stock is 0 or negative", () => {
      expect(calculateRetailValue(0, 25)).toBe(0)
      expect(calculateRetailValue(-5, 25)).toBe(0)
    })
  })

  describe("getStockStatus", () => {
    it("separates out-of-stock from low stock", () => {
      expect(getStockStatus(0, 5, true)).toBe("out")
      expect(getStockStatus(3, 5, true)).toBe("low")
      expect(getStockStatus(6, 5, true)).toBe("in")
    })

    it("returns archived for inactive products", () => {
      expect(getStockStatus(0, 5, false)).toBe("archived")
      expect(getStockStatus(10, 5, false)).toBe("archived")
    })
  })

  describe("stockLevelPercent", () => {
    it("tracks progress against twice the minimum threshold", () => {
      expect(stockLevelPercent(0, 10)).toBe(0)
      expect(stockLevelPercent(10, 10)).toBe(50)
      expect(stockLevelPercent(20, 10)).toBe(100)
      expect(stockLevelPercent(40, 10)).toBe(100)
    })

    it("handles a zero threshold and negative stock", () => {
      expect(stockLevelPercent(5, 0)).toBe(100)
      expect(stockLevelPercent(-5, 10)).toBe(0)
    })
  })

  describe("calculateMarginPercent", () => {
    it("returns gross margin on cost", () => {
      expect(calculateMarginPercent(100, 125)).toBe(25)
      expect(calculateMarginPercent(100, 90)).toBe(-10)
    })

    it("returns 100 when there is no cost basis", () => {
      expect(calculateMarginPercent(0, 50)).toBe(100)
      expect(calculateMarginPercent(0, 0)).toBe(0)
    })
  })
})

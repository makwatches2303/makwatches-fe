import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CATALOG_PAGE_SIZE,
  catalogQueryFromParams,
  catalogQueryKey,
  firstParam,
  sortToQuery,
} from "@/lib/catalog-query";

/**
 * The URL-to-query normalization the server and the browser share.
 *
 * Worth testing on its own because a drift between the two is silent: the
 * server renders one listing and the browser appends batches of another.
 */

describe("sortToQuery", () => {
  it("maps every sort the controls offer", () => {
    assert.deepEqual(sortToQuery("price-asc"), { sortBy: "price", order: "asc" });
    assert.deepEqual(sortToQuery("price-desc"), { sortBy: "price", order: "desc" });
    assert.deepEqual(sortToQuery("name-asc"), { sortBy: "name", order: "asc" });
    assert.deepEqual(sortToQuery("newest"), { sortBy: "createdAt", order: "desc" });
  });

  it("falls back to newest for anything it does not know", () => {
    // Including an edited URL: an unknown sort must not produce an undefined
    // sort field, which the cursor would then fingerprint inconsistently.
    assert.deepEqual(sortToQuery(undefined), { sortBy: "createdAt", order: "desc" });
    assert.deepEqual(sortToQuery("featured"), { sortBy: "createdAt", order: "desc" });
    assert.deepEqual(sortToQuery("nonsense"), { sortBy: "createdAt", order: "desc" });
  });
});

describe("firstParam", () => {
  it("takes the first of a repeated parameter", () => {
    assert.equal(firstParam(["a", "b"]), "a");
    assert.equal(firstParam("a"), "a");
    assert.equal(firstParam(undefined), undefined);
  });
});

describe("catalogQueryFromParams", () => {
  it("defaults to the first page at the shared batch size", () => {
    const query = catalogQueryFromParams({});
    assert.equal(query.page, 1);
    assert.equal(query.limit, CATALOG_PAGE_SIZE);
  });

  it("keeps a listing inside its scope", () => {
    // The gender parameter must narrow a scoped listing, never widen it.
    const query = catalogQueryFromParams({ gender: "Women" }, { mainCategory: "Men", gender: "Men" });
    assert.equal(query.mainCategory, "Men");
    assert.equal(query.gender, "Men");
  });

  it("takes gender from the URL when the scope sets none", () => {
    const query = catalogQueryFromParams({ gender: "Women" }, { mainCategory: "Men" });
    assert.equal(query.gender, "Women");
  });

  it("carries every filter the controls write", () => {
    const query = catalogQueryFromParams({
      q: "diver",
      brand: "Fastrack,Timex",
      dialColor: "Black",
      dialShape: "Round",
      dialType: "Analog",
      strapColor: "Brown",
      strapMaterial: "Leather",
      style: "Casual",
      minPrice: "1000",
      maxPrice: "5000",
      inStock: "true",
      sort: "price-asc",
    });

    assert.equal(query.q, "diver");
    assert.equal(query.brand, "Fastrack,Timex");
    assert.equal(query.dialColor, "Black");
    assert.equal(query.strapMaterial, "Leather");
    assert.equal(query.minPrice, 1000);
    assert.equal(query.maxPrice, 5000);
    assert.equal(query.inStock, true);
    assert.equal(query.sortBy, "price");
    assert.equal(query.order, "asc");
  });

  it("ignores numbers that are not numbers", () => {
    const query = catalogQueryFromParams({ minPrice: "cheap", page: "-4" });
    assert.equal(query.minPrice, undefined);
    assert.equal(query.page, 1, "a negative page must not become a negative skip");
  });
});

describe("catalogQueryKey", () => {
  const men = catalogQueryFromParams({}, { mainCategory: "Men" });

  it("is stable across property order", () => {
    const a = catalogQueryKey({ mainCategory: "Men", q: "diver", sortBy: "price" });
    const b = catalogQueryKey({ sortBy: "price", q: "diver", mainCategory: "Men" });
    assert.equal(a, b);
  });

  it("ignores position within the results", () => {
    // Page and limit say where the shopper is, not what they are looking at.
    // A key that changed with them would reset the feed on every batch.
    const first = catalogQueryKey({ ...men, page: 1, limit: 24 });
    const later = catalogQueryKey({ ...men, page: 5, limit: 48 });
    assert.equal(first, later);
  });

  it("changes when the listing changes", () => {
    const base = catalogQueryKey(men);

    const differing = {
      scope: catalogQueryFromParams({}, { mainCategory: "Women" }),
      search: catalogQueryFromParams({ q: "diver" }, { mainCategory: "Men" }),
      brand: catalogQueryFromParams({ brand: "Timex" }, { mainCategory: "Men" }),
      sort: catalogQueryFromParams({ sort: "price-asc" }, { mainCategory: "Men" }),
      price: catalogQueryFromParams({ minPrice: "2000" }, { mainCategory: "Men" }),
      stock: catalogQueryFromParams({ inStock: "true" }, { mainCategory: "Men" }),
    };

    for (const [name, query] of Object.entries(differing)) {
      assert.notEqual(catalogQueryKey(query), base, `${name} must produce a different key`);
    }
  });

  it("treats an absent filter and an empty one as the same listing", () => {
    // The controls clear a filter by writing an empty value rather than
    // removing the parameter; that must not look like a new listing.
    assert.equal(
      catalogQueryKey({ mainCategory: "Men", dialColor: "" }),
      catalogQueryKey({ mainCategory: "Men" })
    );
  });
});

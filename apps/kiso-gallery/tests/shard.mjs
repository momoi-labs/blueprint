// Drop-in for node:test's `test`. With KISO_TEST_SHARD=i/n, a file registers only
// every nth test, so CI can split one slow file across jobs. Unset, it is plain `test`.
import { test as nodeTest } from "node:test";

const [index, total] = (process.env.KISO_TEST_SHARD ?? "1/1").split("/").map(Number);
let count = 0;

export const test = (...args) => (count++ % total === index - 1 ? nodeTest(...args) : undefined);

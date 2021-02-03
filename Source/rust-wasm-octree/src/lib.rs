use wasm_bindgen::prelude::*;

mod utils;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
  fn alert(s: &str);
}

#[wasm_bindgen]
pub fn add(x: i32, y: i32) -> i32 {
  return x + y;
}

#[wasm_bindgen]
pub fn create_octree(x: Box<[u32]>) -> Box<[u32]> {
  let x1 = (0..42).collect::<Vec<u32>>().into_boxed_slice();
  return x1;
}


// #[wasm_bindgen]
// pub struct KeyPairJS {
//   pub a: *[u8],
//   pub b: *[u8],
// }

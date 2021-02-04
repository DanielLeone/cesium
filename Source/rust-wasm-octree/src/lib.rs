use wasm_bindgen::JsCast;
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
pub fn create_octree(input: &mut [f32]) -> Vec<f32> {
  let mut vec: Vec<f32> = Vec::new();
  let mut c: f32 = 0.0;

  for x in input {
    vec.push(*x);
    vec.push(1.0);

    c += node_add_triangle(
      0,
      0,
      0,
      0,
      1,
      input
    )
  }

  vec[0] = c;
  vec
}


fn node_add_triangle(level: i32, x: i32, y: i32, z: i32, triangle_idx: usize, triangles: &mut [f32]) -> f32 {
  let size_at_level = 1i32 / (2i32.pow(level as u32));
  let aabb_center_x = (x as f32 + 0.5) * size_at_level as f32 - 0.5;
  let aabb_center_y = (y as f32 + 0.5) * size_at_level as f32 - 0.5;
  let aabb_center_z = (z as f32 + 0.5) * size_at_level as f32 - 0.5;

  let overlap = get_overlap(
    aabb_center_x,
    aabb_center_y,
    aabb_center_z,
    triangle_idx,
    triangles
  );

  return overlap.0 as f32;
}


fn get_overlap(
  node_aabb_center_x: f32,
  node_aabb_center_y: f32,
  node_aabb_center_z: f32,
  triangle_idx: usize,
  triangles: &mut [f32]
) -> (u8, u8) {
  let mut bit_mask: u8 = 255; // 11111111
  let mut bit_count: u8 = 8;

  let idx: usize = triangle_idx;

  let aabb_min_x = triangles[&idx * 6 + 0];
  let aabb_max_x = triangles[&idx * 6 + 1];
  let aabb_min_y = triangles[&idx * 6 + 2];
  let aabb_max_y = triangles[&idx * 6 + 3];
  let aabb_min_z = triangles[&idx * 6 + 4];
  let aabb_max_z = triangles[&idx * 6 + 5];

  if aabb_min_x > node_aabb_center_x {
    bit_mask &= 170; // 10101010
    bit_count /= 2;
  } else if aabb_max_x < node_aabb_center_x {
    bit_mask &= 85; // 01010101
    bit_count /= 2;
  }

  if aabb_min_y > node_aabb_center_y {
    bit_mask &= 204; // 11001100
    bit_count /= 2;
  } else if aabb_max_y < node_aabb_center_y {
    bit_mask &= 51; // 00110011
    bit_count /= 2;
  }

  if aabb_min_z > node_aabb_center_z {
    bit_mask &= 240; // 11110000
    bit_count /= 2;
  } else if aabb_max_z < node_aabb_center_z {
    bit_mask &= 15; // 00001111
    bit_count /= 2;
  }
  return (bit_count, bit_mask);
}

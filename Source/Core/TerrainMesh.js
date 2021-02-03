import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import IntersectionTests from "./IntersectionTests.js";
import Ray from "./Ray.js";
import SceneMode from "../Scene/SceneMode.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import when from "../ThirdParty/when.js";
import init, {
  create_octree,
} from "../rust-wasm-octree/pkg/rust_wasm_octree.js";

function run() {
  // First up we need to actually load the wasm file, so we use the
  // default export to inform it where the wasm file is located on the
  // server, and then we wait on the returned promise to wait for the
  // wasm to be loaded.
  //
  // It may look like this: `await init('./pkg/without_a_bundler_bg.wasm');`,
  // but there is also a handy default inside `init` function, which uses
  // `import.meta` to locate the wasm file relatively to js file.
  //
  // Note that instead of a string you can also pass in any of the
  // following things:
  //
  // * `WebAssembly.Module`
  //
  // * `ArrayBuffer`
  //
  // * `Response`
  //
  // * `Promise` which returns any of the above, e.g. `fetch("./path/to/wasm")`
  //
  // This gives you complete control over how the module is loaded
  // and compiled.
  //
  // Also note that the promise, when resolved, yields the wasm module's
  // exports which is the same as importing the `*_bg` module in other
  // modes
  when(init()).then(function () {
    var result = create_octree(new Float64Array([1, 2, 3, 4]));
    console.log(result);
  });
}

run();

/**
 * A mesh plus related metadata for a single tile of terrain.  Instances of this type are
 * usually created from raw {@link TerrainData}.
 *
 * @alias TerrainMesh
 * @constructor
 *
 * @param {Cartesian3} center The center of the tile.  Vertex positions are specified relative to this center.
 * @param {Float32Array} vertices The vertex data, including positions, texture coordinates, and heights.
 *                       The vertex data is in the order [X, Y, Z, H, U, V], where X, Y, and Z represent
 *                       the Cartesian position of the vertex, H is the height above the ellipsoid, and
 *                       U and V are the texture coordinates.
 * @param {Uint8Array|Uint16Array|Uint32Array} indices The indices describing how the vertices are connected to form triangles.
 * @param {Number} indexCountWithoutSkirts The index count of the mesh not including skirts.
 * @param {Number} vertexCountWithoutSkirts The vertex count of the mesh not including skirts.
 * @param {Number} minimumHeight The lowest height in the tile, in meters above the ellipsoid.
 * @param {Number} maximumHeight The highest height in the tile, in meters above the ellipsoid.
 * @param {BoundingSphere} boundingSphere3D A bounding sphere that completely contains the tile.
 * @param {Cartesian3} occludeePointInScaledSpace The occludee point of the tile, represented in ellipsoid-
 *                     scaled space, and used for horizon culling.  If this point is below the horizon,
 *                     the tile is considered to be entirely below the horizon.
 * @param {Number} [vertexStride=6] The number of components in each vertex.
 * @param {OrientedBoundingBox} [orientedBoundingBox] A bounding box that completely contains the tile.
 * @param {TerrainEncoding} encoding Information used to decode the mesh.
 * @param {Number} exaggeration The amount that this mesh was exaggerated.
 * @param {Number[]} westIndicesSouthToNorth The indices of the vertices on the Western edge of the tile, ordered from South to North (clockwise).
 * @param {Number[]} southIndicesEastToWest The indices of the vertices on the Southern edge of the tile, ordered from East to West (clockwise).
 * @param {Number[]} eastIndicesNorthToSouth The indices of the vertices on the Eastern edge of the tile, ordered from North to South (clockwise).
 * @param {Number[]} northIndicesWestToEast The indices of the vertices on the Northern edge of the tile, ordered from West to East (clockwise).
 *
 * @private
 */
function TerrainMesh(
  center,
  vertices,
  indices,
  indexCountWithoutSkirts,
  vertexCountWithoutSkirts,
  minimumHeight,
  maximumHeight,
  boundingSphere3D,
  occludeePointInScaledSpace,
  vertexStride,
  orientedBoundingBox,
  encoding,
  exaggeration,
  westIndicesSouthToNorth,
  southIndicesEastToWest,
  eastIndicesNorthToSouth,
  northIndicesWestToEast,
  trianglePicking
) {
  /**
   * The center of the tile.  Vertex positions are specified relative to this center.
   * @type {Cartesian3}
   */
  this.center = center;

  /**
   * The vertex data, including positions, texture coordinates, and heights.
   * The vertex data is in the order [X, Y, Z, H, U, V], where X, Y, and Z represent
   * the Cartesian position of the vertex, H is the height above the ellipsoid, and
   * U and V are the texture coordinates.  The vertex data may have additional attributes after those
   * mentioned above when the {@link TerrainMesh#stride} is greater than 6.
   * @type {Float32Array}
   */
  this.vertices = vertices;

  /**
   * The number of components in each vertex.  Typically this is 6 for the 6 components
   * [X, Y, Z, H, U, V], but if each vertex has additional data (such as a vertex normal), this value
   * may be higher.
   * @type {Number}
   */
  this.stride = defaultValue(vertexStride, 6);

  /**
   * The indices describing how the vertices are connected to form triangles.
   * @type {Uint8Array|Uint16Array|Uint32Array}
   */
  this.indices = indices;

  /**
   * The index count of the mesh not including skirts.
   * @type {Number}
   */
  this.indexCountWithoutSkirts = indexCountWithoutSkirts;

  /**
   * The vertex count of the mesh not including skirts.
   * @type {Number}
   */
  this.vertexCountWithoutSkirts = vertexCountWithoutSkirts;

  /**
   * The lowest height in the tile, in meters above the ellipsoid.
   * @type {Number}
   */
  this.minimumHeight = minimumHeight;

  /**
   * The highest height in the tile, in meters above the ellipsoid.
   * @type {Number}
   */
  this.maximumHeight = maximumHeight;

  /**
   * A bounding sphere that completely contains the tile.
   * @type {BoundingSphere}
   */
  this.boundingSphere3D = boundingSphere3D;

  /**
   * The occludee point of the tile, represented in ellipsoid-
   * scaled space, and used for horizon culling.  If this point is below the horizon,
   * the tile is considered to be entirely below the horizon.
   * @type {Cartesian3}
   */
  this.occludeePointInScaledSpace = occludeePointInScaledSpace;

  /**
   * A bounding box that completely contains the tile.
   * @type {OrientedBoundingBox}
   */
  this.orientedBoundingBox = orientedBoundingBox;

  /**
   * Information for decoding the mesh vertices.
   * @type {TerrainEncoding}
   */
  this.encoding = encoding;

  /**
   * The amount that this mesh was exaggerated.
   * @type {Number}
   */
  this.exaggeration = exaggeration;

  /**
   * The indices of the vertices on the Western edge of the tile, ordered from South to North (clockwise).
   * @type {Number[]}
   */
  this.westIndicesSouthToNorth = westIndicesSouthToNorth;

  /**
   * The indices of the vertices on the Southern edge of the tile, ordered from East to West (clockwise).
   * @type {Number[]}
   */
  this.southIndicesEastToWest = southIndicesEastToWest;

  /**
   * The indices of the vertices on the Eastern edge of the tile, ordered from North to South (clockwise).
   * @type {Number[]}
   */
  this.eastIndicesNorthToSouth = eastIndicesNorthToSouth;

  /**
   * The indices of the vertices on the Northern edge of the tile, ordered from West to East (clockwise).
   * @type {Number[]}
   */
  this.northIndicesWestToEast = northIndicesWestToEast;

  /**
   * TODO - add a method here rather than a public property
   */
  this.trianglePicking = trianglePicking;
}

var scratchCartographic = new Cartographic();

/**
 *
 * @param encoding
 * @param {SceneMode} mode
 * @param {GeographicProjection|WebMercatorProjection} projection
 * @param vertices
 * @param index
 * @param result
 * @return {*}
 */
function getPosition(encoding, mode, projection, vertices, index, result) {
  encoding.decodePosition(vertices, index, result);

  if (defined(mode) && mode !== SceneMode.SCENE3D) {
    // TODO why do we need to do this?....
    var ellipsoid = projection.ellipsoid;
    var positionCart = ellipsoid.cartesianToCartographic(
      result,
      scratchCartographic
    );
    projection.project(positionCart, result);
    Cartesian3.fromElements(result.z, result.x, result.y, result);
  }

  return result;
}

/**
 *
 * @param ray
 * @param cullBackFaces
 * @param mode
 * @param projection
 * @returns {Cartesian3}
 */
TerrainMesh.prototype.pickRay = function (
  ray,
  cullBackFaces,
  mode,
  projection
) {
  var canNewPick = mode === SceneMode.SCENE3D && defined(this.trianglePicking);
  var newPickValue;
  if (canNewPick) {
    console.time("new pick");
    newPickValue = this.trianglePicking.rayIntersect(ray, cullBackFaces);
    console.timeEnd("new pick");
  }

  /**
   *
   * @param {TerrainMesh} mesh
   * @return {Cartesian3|*|undefined}
   */
  function oldPick(mesh) {
    var vertices = mesh.vertices;
    var indices = mesh.indices;
    var encoding = mesh.encoding;
    var indicesLength = indices.length;

    var scratchV0 = new Cartesian3();
    var scratchV1 = new Cartesian3();
    var scratchV2 = new Cartesian3();

    var minT = Number.MAX_VALUE;

    for (var i = 0; i < indicesLength; i += 3) {
      var i0 = indices[i];
      var i1 = indices[i + 1];
      var i2 = indices[i + 2];

      var v0 = getPosition(encoding, mode, projection, vertices, i0, scratchV0);
      var v1 = getPosition(encoding, mode, projection, vertices, i1, scratchV1);
      var v2 = getPosition(encoding, mode, projection, vertices, i2, scratchV2);

      var t = IntersectionTests.rayTriangleParametric(
        ray,
        v0,
        v1,
        v2,
        cullBackFaces
      );
      if (defined(t) && t < minT && t >= 0.0) {
        minT = t;
      }
    }
    return minT !== Number.MAX_VALUE ? Ray.getPoint(ray, minT) : undefined;
  }

  var doOldPick = false;

  var oldPickValue;
  if (doOldPick) {
    console.time("old pick");
    oldPickValue = oldPick(this);
    console.timeEnd("old pick");
  }

  if (
    doOldPick &&
    canNewPick &&
    !Cartesian3.equals(newPickValue, oldPickValue)
  ) {
    console.error("pick values are different");
  }
  return newPickValue || oldPickValue;
};

export default TerrainMesh;

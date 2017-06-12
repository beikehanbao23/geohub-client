import utils from "./utils";
import Dijkstras from "./dijkstras";
import cloneDeep from "clone-deep";
import turf from "@turf/turf";

module.exports = function (ctx) {
  let graphData = {};
  let originalData = null;

  const addVertex = function (startPoint, endPoint, length, data) {
    let startData = data[startPoint];
    if (!startData) {
      startData = {};
      data[startPoint] = startData;
    }
    if (!startData[endPoint]) {
      startData[endPoint] = length;
    }
  };

  const addVertexPointTwoWay = function (startCoord, endCoords, length, data) {
    const startPoint = startCoord.join("#");
    const endPoint = endCoords.join("#");
    addVertex(startPoint, endPoint, length, data);
    addVertex(endPoint, startPoint, length, data);
  };

  const createDataGraph = function (mesh) {
    graphData = {};
    mesh.forEach((vertex) => {
      const coords = vertex.geometry.coordinates;
      const startPoint = coords[0].join("#");
      const endPoint = coords[coords.length - 1].join("#");
      const length = vertex.properties.length;
      addVertex(startPoint, endPoint, length, graphData);
      addVertex(endPoint, startPoint, length, graphData);
    });
  };

  const queryMapFeatures = function (lngLat) {
    const radius = 0.001;
    const bbox = [
      ctx.map.project([lngLat.lng - radius, lngLat.lat - radius]),
      ctx.map.project([lngLat.lng + radius, lngLat.lat + radius])
    ];
    const filter = {layers: ["geohub-snaplayer", "geohub-line-cold", "geohub-line-hot"]};
    const features = ctx.map.queryRenderedFeatures(bbox, filter);
    return ctx.featureIndex.getFeaturesFromIndex(features);
  };

  return {
    addData: function (fc) {
      originalData = fc;
      ctx.featureIndex.addFeatures(fc.features);
      createDataGraph(utils.createSimpleMesh(fc.features));
      ctx.map.addSource('geohub-snaplayer', {
        type: 'geojson',
        data: fc
      });

      ctx.map.addLayer({
        id: "geohub-snaplayer",
        source: "geohub-snaplayer",
        type: "line",
        paint: {
          "line-color": "#888",
          "line-width": 4,
          "line-opacity": 0.3
        }
      });
    },
    recreateIndices: function (newFeatures) {
      const allFeatures = [...originalData.features, ...newFeatures];
      ctx.featureIndex.reset();
      ctx.featureIndex.addFeatures(allFeatures);
      createDataGraph(utils.createSimpleMesh(allFeatures));
    },
    addFeatureToIndex: function (newFeature) {
      ctx.featureIndex.addFeatures([newFeature]);
      const allFeatures = [...originalData.features, newFeature];
      createDataGraph(utils.createSimpleMesh(allFeatures));
    },
    featuresAt: function (lnglat) {
      return queryMapFeatures(lnglat); //utils.findClosestFeatures(indexData, lnglat, 0.001);
    },
    getRouteFromTo: function (fromPoint, toPoint) {
      const g = new Dijkstras();
      if (fromPoint.borders || toPoint.borders) {
        const graphDataCopy = cloneDeep(graphData);
        if (utils.sameBorders(fromPoint.borders, toPoint.borders)) {
          const border1 = fromPoint.borders.border1;
          const border2 = fromPoint.borders.border2;
          const point1 = fromPoint.coords;
          const point2 = toPoint.coords;

          const border1ToPoint1 = turf.distance(turf.point(border1), turf.point(point1));
          const border1ToPoint2 = turf.distance(turf.point(border1), turf.point(point2));
          if (border1ToPoint1 < border1ToPoint2) {
            addVertexPointTwoWay(border1, point1, border1ToPoint1, graphDataCopy);
            addVertexPointTwoWay(point2, border2, turf.distance(turf.point(point2), turf.point(border2)), graphDataCopy);
          } else {
            addVertexPointTwoWay(border1, point2, border1ToPoint2, graphDataCopy);
            addVertexPointTwoWay(point1, border2, turf.distance(turf.point(point1), turf.point(border2)), graphDataCopy);
          }
          addVertexPointTwoWay(point1, point2, turf.distance(turf.point(point1), turf.point(point2)), graphDataCopy);
        } else {
          if (fromPoint.borders) {
            const borders = fromPoint.borders;
            const point = fromPoint.coords;
            addVertexPointTwoWay(borders.border1, point, borders.distance1, graphDataCopy);
            addVertexPointTwoWay(borders.border2, point, borders.distance2, graphDataCopy);
          }
          if (toPoint.borders) {
            const borders = toPoint.borders;
            const point = toPoint.coords;
            addVertexPointTwoWay(borders.border1, point, borders.distance1, graphDataCopy);
            addVertexPointTwoWay(borders.border2, point, borders.distance2, graphDataCopy);
          }
        }
        g.setVertices(graphDataCopy);
      } else {
        g.setVertices(graphData);
      }
      const path = g.shortestPath(fromPoint.coords.join("#"), toPoint.coords.join("#")).concat([fromPoint.coords.join("#")]).reverse();
      if (path && path.length > 1) {
        const coords = [];
        path.forEach((point) => {
          const pair = point.split("#");
          coords.push([Number(pair[0]), Number(pair[1])]);
        });
        return coords;
      } else {
        return null;
      }
    }
  };
};
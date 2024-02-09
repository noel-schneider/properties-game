import React, { useEffect } from 'react';
import ForceGraph, {GraphData, NodeObject} from 'force-graph';
import {getNRandomElements} from "./utils";
import {getAllConcepts, Concept} from "./concepts-interface";


class ConceptGraph {
    allConcepts: string[];
    nodes: { name: string; id: number }[];
    links: { source: number; target: number }[]; // Replace 'any' with the actual type

  constructor(initial_nb_nodes: number) {
    this.allConcepts = Object.keys((getAllConcepts()));
    const nRandomConcepts = getNRandomElements(this.allConcepts, initial_nb_nodes);
    this.nodes = Array(initial_nb_nodes).fill(0).map((_, index) => index).map((i) => ({ id: i, name: nRandomConcepts[i]}));
    this.links = [];
    // links: [...Array(N).keys()]
    //   .filter(id => id)
    //   .map(id => ({
    //     source: id,
    //     target: Math.round(Math.random() * (id - 1)),
    //   })),
  }
}

export interface Node {
    name: any;
    x: any;
    y: any;
}

function Graph({updateSelectedNodes}) {

  useEffect(() => {

    let graphData = new ConceptGraph(15);
    let selectedNodes = new Set();

    const Graph = ForceGraph()
        // TODO: replace the document.getElementById('graph') with a ref
      (document.getElementById('graph'))
        .graphData(graphData)
        .nodeCanvasObjectMode(() => "after") // Add text in front of the node
        .nodeCanvasObject((node: Node, ctx) => {
          const label = node.name;
          ctx.font = "12px Poppins";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "black"; //node.color;
          ctx.lineWidth = 1; // Adjust the border width as needed
          ctx.strokeStyle = '#black';
          ctx.stroke();
          ctx.fillText(label, node.x, node.y);
        })
        .nodeRelSize(40) // Diameter of the node
        .linkColor(() => 'rgba(100, 100, 100, 0.2)') // Set link color (rgba format for transparency)
        .linkWidth(0) // Set link width
        .nodeLabel('title')
        .nodeColor((node: NodeObject) => selectedNodes.has(node) ? '#ffad69' : '#e2dcde')
        .onNodeClick((node: NodeObject, event: { ctrlKey: any; shiftKey: any; altKey: any; }) => {
          if (event.ctrlKey || event.shiftKey || event.altKey) { // multi-selection
            selectedNodes.has(node) ? selectedNodes.delete(node) : selectedNodes.add(node);
          } else { // single-selection
            const untoggle = selectedNodes.has(node) && selectedNodes.size === 1;
            selectedNodes.clear();
            !untoggle && selectedNodes.add(node);
          }

          Graph.nodeColor(Graph.nodeColor()); // update color of selected nodes
          updateSelectedNodes(selectedNodes);
        })
        .onNodeDrag((node, translate) => {
          if (selectedNodes.has(node)) { // moving a selected node
            Array(selectedNodes)
              .filter(selNode => selNode !== node) // don't touch node being dragged
              .forEach(node => ['x', 'y'].forEach(coord => node[`f${coord}`] = node[coord] + translate[coord])); // translate other nodes by the same amount
          }
        })
        .onNodeDragEnd(node => {
          if (selectedNodes.has(node)) { // finished moving a selected node
            Array(selectedNodes)
              .filter(selNode => selNode !== node) // don't touch node being dragged
              .forEach(node => ['x', 'y'].forEach(coord => node[`f${coord}`] = undefined)); // unfix controlled nodes
          }
        });

    // Cleanup function
    return () => {
      Graph.onEngineStop(undefined); // Stop the physics engine when the component unmounts
    };
  }, []); // Empty dependency array means this effect runs once when the component mounts

  return (
    <div id="graph" style={{ width: '100%', height: '500px' }}>
      {/* The graph will be rendered here */}
    </div>
  );
}

export default Graph;
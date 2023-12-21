import React, { useEffect } from 'react';
import ForceGraph from 'force-graph';

function App() {
  useEffect(() => {
    // Random tree
    const N = 30;
    const gData = {
      nodes: [...Array(N).keys()].map(i => ({ id: i, name: `node ${i}`})),
      links: [],
      // links: [...Array(N).keys()]
      //   .filter(id => id)
      //   .map(id => ({
      //     source: id,
      //     target: Math.round(Math.random() * (id - 1)),
      //   })),
      titles: [...Array(N).keys()].map(i => Math.round(Math.random() * (i - 1))),
    };

    let selectedNodes = new Set();

    const Graph = ForceGraph()
      (document.getElementById('graph'))
        .graphData(gData)
        .nodeCanvasObjectMode(() => "after") // Add text in front of the node
        .nodeCanvasObject((node, ctx, globalScale) => {
          const label = node.name;
          ctx.font = "12px Sans-Serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "black"; //node.color;
          ctx.fillText(label, node.x, node.y);
        })
        .nodeRelSize(40)
        .linkColor(() => 'rgba(100, 100, 100, 0.2)') // Set link color (rgba format for transparency)
        .linkWidth(0) // Set link width
        .nodeLabel('title')
        .nodeColor(node => selectedNodes.has(node) ? 'yellow' : 'grey')
        .onNodeClick((node, event) => {
          if (event.ctrlKey || event.shiftKey || event.altKey) { // multi-selection
            selectedNodes.has(node) ? selectedNodes.delete(node) : selectedNodes.add(node);
          } else { // single-selection
            const untoggle = selectedNodes.has(node) && selectedNodes.size === 1;
            selectedNodes.clear();
            !untoggle && selectedNodes.add(node);
          }

          Graph.nodeColor(Graph.nodeColor()); // update color of selected nodes
        })
        .onNodeDrag((node, translate) => {
          if (selectedNodes.has(node)) { // moving a selected node
            [...selectedNodes]
              .filter(selNode => selNode !== node) // don't touch node being dragged
              .forEach(node => ['x', 'y'].forEach(coord => node[`f${coord}`] = node[coord] + translate[coord])); // translate other nodes by the same amount
          }
        })
        .onNodeDragEnd(node => {
          if (selectedNodes.has(node)) { // finished moving a selected node
            [...selectedNodes]
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

export default App;
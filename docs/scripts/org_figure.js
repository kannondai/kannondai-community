const data = {
  name: "区会連合会",
  children: [
    {
      name: "谷田部地区連合会",
      children: [
        {
          name: "谷田部支部",
          children: [
            { name: "観音台第1自治会" },
            { name: "観音台第2自治会" },
            { name: "…" } // 他の区会を示唆
          ]
        },
        { name: "…", children: [] } // 他の支部を示唆
      ]
    },
    {
      name: "〇〇地区連合会",
      children: [
        {
          name: "〇〇支部",
          children: [
            { name: "ＡＡ自治会" },
            { name: "ＢＢ自治会" },
            { name: "…" } // 他の区会を示唆
          ]
        },
        { name: "…", children: [] } // 他の支部を示唆
      ]
    },
    {
      name: "…",
      children: [] // 他の地区連合会を示唆
    }
  ]
};

const width = 800; // 横幅を拡大
const height = 380; // 4階層に合わせて縦を拡大

const marginTop = 25; // 上余白（ルートノードの上端分を確保）

let svg;

document.addEventListener("DOMContentLoaded", () => {
  console.log("ページがリロードされました。");
  console.log("データ構造:", data);

  svg = d3.select("#organization-chart-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(20,${marginTop})`); // 横方向のマージンを減らす

  const treeLayout = d3.tree()
    .size([width - 100, height - 100])
    .separation((a, b) => {
      console.log("separation 関数が呼び出されました:", a.data.name, b.data.name); // デバッグ用ログ

      if (a.parent === b.parent) {
        // 同じ親を持つ場合の間隔を調整
        if ((a.data.name.includes("自治会") && b.data.name.includes("自治会")) ||
            (a.data.name === "…" && b.data.name.includes("自治会")) ||
            (b.data.name === "…" && a.data.name.includes("自治会"))) {
          console.log(`自治会間の間隔を調整しています: ${a.data.name} と ${b.data.name}`);
          return 0.9; // 「自治会間の間隔を狭める
        }
        if ((a.data.name.includes("支部") && b.data.name.includes("支部")) ||
            (a.data.name === "…" && b.data.name.includes("支部")) ||
            (b.data.name === "…" && a.data.name.includes("支部"))) {
          console.log(`支部間の間隔を調整しています: ${a.data.name} と ${b.data.name}`);
          return 1; // 支部間の間隔
        }
        if ((a.data.name.includes("地区連合会") && b.data.name.includes("地区連合会")) ||
            (a.data.name === "…" && b.data.name.includes("地区連合会")) ||
            (b.data.name === "…" && a.data.name.includes("地区連合会"))) {
          console.log(`地区連合会間の間隔を調整しています: ${a.data.name} と ${b.data.name}`);
          return 1; // 地区連合会間の間隔
        }
      }
      console.log(`間隔: ${a.data.name} と ${b.data.name}, 値: 1`);
      return 1; // デフォルトの間隔
    });

  const root = d3.hierarchy(data);
  treeLayout(root);

  console.log("ツリーレイアウトが適用されました。");

  svg.selectAll("path")
    .data(root.links())
    .enter()
    .append("path")
    .attr("d", d => {
      const midY = (d.source.y + d.target.y) / 2;
      return `
        M ${d.source.x},${d.source.y} 
        V ${midY} 
        H ${d.target.x} 
        V ${d.target.y}
      `;
    })
    .attr("fill", "none")
    .attr("stroke", "#ccc");

  console.log("リンクが描画されました。");

  const nodes = svg.selectAll("g.node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  nodes.append("rect")
    .attr("width", 100)
    .attr("height", 30)
    .attr("x", -50)
    .attr("y", -15)
    .attr("fill", "#f9f9f9")
    .attr("stroke", "#ccc")
    .attr("rx", 5);

  nodes.append("text")
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text(d => d.data.name);

  console.log("ノードが描画されました。");
});
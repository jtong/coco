function renderCodeExplorer(freedom, elementId) {
  let margin = {top: 20, right: 20, bottom: 50, left: 50};
  let width = GraphConfig.width - margin.left - margin.right;
  let height = GraphConfig.height - margin.top - margin.bottom;

  let ellipse = d3
    .range(100)
    .map(i => [
      (width * (1 + 0.99 * Math.cos((i / 50) * Math.PI))) / 2,
      (height * (1 + 0.99 * Math.sin((i / 50) * Math.PI))) / 2
    ])

  let selectedYear = 2016;
  let bigFormat = d3.format(",.0f");

  let minYear = d3.min(freedom, d => d.year);
  let maxYear = d3.max(freedom, d => d.year);
  let freedom_year = freedom.filter(obj => {
    return obj.year === selectedYear
  });
  //
  // let freedom_nest = d3.nest()
  //   .key(d => d.region_simple)
  //   .entries(freedom_year)

  let freedom_nest = d3.group(freedom_year, d => d.region_simple)

  let data_nested = {key: "freedom_nest", values: freedom_nest}

  let population_hierarchy = d3.hierarchy(data_nested, d => d.values).sum(d => d.population);

  function colorHierarchy(hierarchy) {
    if (hierarchy.depth === 0) {
      hierarchy.color = 'black';
    } else if (hierarchy.depth === 1) {
      hierarchy.color = regionColor(hierarchy.data.key);
    } else {
      hierarchy.color = hierarchy.parent.color;
    }
    if (hierarchy.children) {
      hierarchy.children.forEach(child => colorHierarchy(child))
    }
  }

  let regionColor = function (region) {
    let colors = {
      "Middle East and Africa": "#596F7E",
      "Americas": "#168B98",
      "Asia": "#ED5B67",
      "Oceania": "#fd8f24",
      "Europe": "#919c4c"
    };
    return colors[region];
  }

  let svg = d3.select(elementId).append("svg")
    .attr("width", GraphConfig.width)
    .attr("height", GraphConfig.height)
  svg
    .append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .style("fill", "#F5F5F2");

  const voronoi = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  const labels = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  const pop_labels = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let seed = new Math.seedrandom(20);
  let voronoiTreeMap = d3.voronoiTreemap()
    .prng(seed)
    .clip(ellipse);

  voronoiTreeMap(population_hierarchy);
  colorHierarchy(population_hierarchy);

  let allNodes = population_hierarchy.descendants()
    .sort((a, b) => b.depth - a.depth)
    .map((d, i) => Object.assign({}, d, {id: i}));

  let hoveredShape = null;

  voronoi.selectAll('path')
    .data(allNodes)
    .enter()
    .append('path')
    .attr('d', d => "M" + d.polygon.join("L") + "Z")
    .style('fill', d => d.parent ? d.parent.color : d.color)
    .attr("stroke", "#F5F5F2")
    .attr("stroke-width", 0)
    .style('fill-opacity', d => d.depth === 2 ? 1 : 0)
    .attr('pointer-events', d => d.depth === 2 ? 'all' : 'none')
    .on('mouseenter', d => {
      let label = labels.select(`.label-${d.id}`);
      label.attr('opacity', 1)
      let pop_label = pop_labels.select(`.label-${d.id}`);
      pop_label.attr('opacity', 1)
    })
    .on('mouseleave', d => {
      let label = labels.select(`.label-${d.id}`);
      label.attr('opacity', d => d.data.population > 130000000 ? 1 : 0)
      let pop_label = pop_labels.select(`.label-${d.id}`);
      pop_label.attr('opacity', d => d.data.population > 130000000 ? 1 : 0)
    })
    .transition()
    .duration(1000)
    .attr("stroke-width", d => 7 - d.depth * 2.8)
    .style('fill', d => d.color);

  labels.selectAll('text')
    .data(allNodes.filter(d => d.depth === 2))
    .enter()
    .append('text')
    .attr('class', d => `label-${d.id}`)
    .attr('text-anchor', 'middle')
    .attr("transform", d => "translate(" + [d.polygon.site.x, d.polygon.site.y + 6] + ")")
    .text(d => d.data.key || d.data.countries)
    //.attr('opacity', d => d.data.key === hoveredShape ? 1 : 0)
    .attr('opacity', function (d) {
      if (d.data.key === hoveredShape) {
        return (1);
      } else if (d.data.population > 130000000) {
        return (1);
      } else {
        return (0);
      }
    })

    .attr('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('fill', 'black')
    .style('font-family', 'Montserrat');

  pop_labels.selectAll('text')
    .data(allNodes.filter(d => d.depth === 2))
    .enter()
    .append('text')
    .attr('class', d => `label-${d.id}`)
    .attr('text-anchor', 'middle')
    .attr("transform", d => "translate(" + [d.polygon.site.x, d.polygon.site.y + 25] + ")")
    .text(d => bigFormat(d.data.population))
    //.attr('opacity', d => d.data.key === hoveredShape ? 1 : 0)
    .attr('opacity', function (d) {
      if (d.data.key === hoveredShape) {
        return (1);
      } else if (d.data.population > 130000000) {
        return (1);
      } else {
        return (0);
      }
    })

    .attr('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('fill', 'black')
    .style('font-size', '12px')
    .style('font-family', 'Montserrat');

}

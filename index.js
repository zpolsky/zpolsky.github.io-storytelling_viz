let dataByYear = {};
const groupYears = [-1, -2, -3, -4, -5, -6, -7];
const extraButtons = groupYears.length;

function rgb(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

function getStateName(location) {
  return location.substring(location.indexOf(',') + 2);
}

function getAllYears(data) {
  // Create array to store all years for buttons
  const allYears = [];
  data.forEach(d => {
    const date = (new Date(d.Date)).getFullYear();
    if (!allYears.includes(date)) {
      allYears.push(date);
    }
  });
  allYears.reverse();

  // Create dictionary of shootings by years
  allYears.forEach(year => {
    const yearData = [];
    data.forEach(d => {
      const date = (new Date(d.Date)).getFullYear();
      if (year === date) {
        yearData.push(d);
      }
    })
    dataByYear[year] = yearData;
  });
  allYears.push(...groupYears); // used to display all data and decades
  return allYears;
}

function checkDecade(key, year) {
  const decade = (year >= 2000) ? year - 2000 : year - 1900;
  switch (key) {
    case -1: return true;
    case -2: return decade >= 60 && decade < 70;
    case -3: return decade >= 70 && decade < 80;
    case -4: return decade >= 80 && decade < 90;
    case -5: return decade >= 90 && decade <= 99;
    case -6: return decade >= 0 && decade < 10;
    case -7: return decade >= 10 && decade < 20;
    default: return false;
  }
}

// Adapted from http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
// Map json file found at https://www.packtpub.com/mapt/book/web_development/9781785280085/12/ch12lvl1sec57/creating-a-map-of-the-united-states
function createMap(year, allYears) {
  const width = 1000;
  const height = 500;
  const scale = 1000;

  let projection = d3.geoAlbersUsa()
        .translate([width/2, height/2])
        .scale([scale]);

  let path = d3.geoPath().projection(projection);

  let svg = d3.select('#viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

  let tooltip = d3.select('#viz')
		    .append('div')
        .attr('id', 'tooltip')
    		.attr('class', 'tooltip')
    		.style('opacity', 0);

  let summaryBox = d3.select('#viz')
        .append('div')
        .attr('id', 'summaryBox')
        .attr('class', 'summaryBox')
        .style('opacity', 0)
        .style('left', '1000px')
        .style('top', '1300px');

  let pieDiv = d3.select('#viz')
        .append('div')
        .attr('id', 'pieDiv')
        .attr('class', 'pieDiv')
        .style('opacity', 1)
        .style('left', '1000px')
        .style('top', '1250px');

  d3.json('./data/us-states.json', json => {
    if (groupYears.includes(year)) {
      for (let i = 0; i < allYears.length - extraButtons; i++) {
        const currentYear = allYears[i];
        if (checkDecade(year, currentYear)) {
          dataByYear[currentYear].forEach(d => {
            for (let j = 0; j < json.features.length; ++j) {
              const jsonState = json.features[j].properties.name;
              const stateName = getStateName(d.Location);
              if (stateName === jsonState) {
                if (!json.features[j].properties.shootings) {
                  json.features[j].properties.shootings = [d];
                } else {
                  json.features[j].properties.shootings.push(d);
                }
              }
            }
          });
        }
      };
    } else {
      dataByYear[year].forEach(d => {
        for (let j = 0; j < json.features.length; ++j) {
          const jsonState = json.features[j].properties.name;
          const stateName = getStateName(d.Location);
          if (stateName === jsonState) {
            if (!json.features[j].properties.shootings) {
              json.features[j].properties.shootings = [d];
            } else {
              json.features[j].properties.shootings.push(d);
            }
          }
        }
      });
    }

    svg.selectAll('path')
      .data(json.features)
    	.enter()
    	.append('path')
    	.attr('d', path)
    	.style('stroke', '#fff')
    	.style('stroke-width', '1')
      .style('fill', d => {
        const value = d.properties.shootings;
        if (value) {
          return rgb(200, 0, 0)
        } else {
          return rgb(213, 222, 217);
        }
      })
      .on('click', d => {
        const shootings = d.properties.shootings;
        if (shootings) {
          let stateVictims = 0;
          let stateFatalities = 0;
          let statePolice = 0;
          let stateInjured = 0;

          shootings.forEach(shooting => {
            stateVictims += shooting.Total_Victims;
            stateFatalities += shooting.Fatalities;
            statePolice += shooting.Policeman_Killed;
            stateInjured += shooting.Injured;
          });

          pieDiv.style('opacity', 0);

          summaryBox.html(() => {
            let text = `
            <h4><b>${getStateName(shootings[0].Location)}</b></h4>
            <p><b>Number of shootings</b>: ${shootings.length}</p>
            <span><b>Total Victims</b>: ${stateVictims}</span>
            <ul>
              <li>Fatalities: ${stateFatalities}</li>
              <li>Police Killed: ${statePolice}</li>
              <li>Injured: ${stateInjured}</li>
            </ul>
            <span><b>Shootings</b>:</span>
            <ul>
            `;
            shootings.forEach(shooting => {
              text += `<li><em>${shooting.Title} (${(new Date(shooting.Date)).getFullYear()})</em></li>`
            });
            text += '</ul>';
            return text;
          })
          .style('opacity', 1);
        } else {
          summaryBox.html('').style('opactiy', 0);
        }
      });

    svg.selectAll('circle')
      .data(() => {
        if (groupYears.includes(year)) {
          const allData = [];
          for (let i = 0; i < allYears.length - extraButtons; i++) {
            const currentYear = allYears[i];
            if (checkDecade(year, currentYear)) {
              dataByYear[currentYear].forEach(d => {
                allData.push(d);
              });
            }
          };
          return allData;
        } else {
          return dataByYear[year];
        }
      })
      .enter()
      .append('circle')
      .attr('cx', d => {
        return projection([d.Longitude, d.Latitude])[0];
      })
      .attr('cy', d => {
        return projection([d.Longitude, d.Latitude])[1];
      })
      .attr('r', d => {
        return Math.sqrt(d.Total_Victims) * 1.5;
      })
      .style('fill', d => {
        switch(d.Gender) {
          case 'M': return rgb(6, 55, 135);
          case 'F': return rgb(155, 0, 150);
          default: return rgb(32, 32, 32);
        }
      })
      // .style('fill', rgb(32, 32, 32))
      .style('opacity', 0.75)
      .on('mouseover', d => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.text(`${d.Title}`)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px')
      })
      .on('mouseout', d => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0);
      })
      .on('click', d => {
        summaryBox.html(
          `
          <h5><b>${d.Title} (${(new Date(d.Date)).getFullYear()})</b></h5>
          <p><b>Location</b>: ${d.Location}</p>
          <p><b>Date</b>: ${d.Date}</p>
          <p><b>Summary</b>: ${d.Summary}</p>
          <span><b>Total Victims</b>: ${d.Total_Victims}</span>
          <ul>
            <li>Fatalities: ${d.Fatalities}</li>
            <li>Police Killed: ${d.Policeman_Killed}</li>
            <li>Injured: ${d.Injured}</li>
          </ul>
          <span><b>Shooter</b>:</span>
          <ul>
            <li>Gender: ${d.Gender}</li>
            <li>Age: ${d.Age}</li>
            <li>Race: ${d.Race}</li>
            <li>Mental Health Issues: ${d.Mental_Health_Issues}</li>
            <li>Employed: ${d.Employed}</li>
          </ul>
          `
        )
        .style('opacity', 1);
        pieDiv.style('opacity', 0);
      });
      createPieChart(year, pieDiv, allYears);
  });
}

function createPieChart(year, pieDiv, allYears) {
  // Adapted from https://bl.ocks.org/mbostock/3887193
  const pieWidth = 500;
  const pieHeight = 500;
  const radius = Math.min(pieWidth, pieHeight)/2;

  pieDiv.append('h3')
    .html(`Mental Health Summary: ${getYearText(year)}`)
    .style('position', 'absolute')
    .style('top', '50px')
    .style('left', '-50px')

  let pieSVG = pieDiv.append('svg')
    .attr('width', pieWidth)
    .attr('height', pieWidth)
    .append('g')
    .attr('transform', `translate(${pieWidth/4}, ${pieHeight/2})`);

  const arc = d3.arc()
    .outerRadius(radius/2)
    .innerRadius(radius/4);

  const pie = d3.pie()
    .sort(null)
    .value(d => { return d.value; });

  let healthData = {
    Yes: 0,
    No: 0,
    Unclear: 0,
    Unknown: 0
  };
  if (groupYears.includes(year)) {
    for (let i = 0; i < allYears.length - extraButtons; i++) {
      const currentYear = allYears[i];
      if (checkDecade(year, currentYear)) {
        dataByYear[currentYear].forEach(d => {
          healthData[d.Mental_Health_Issues]++;
        });
      }
    }
  } else {
    dataByYear[year].forEach(d => {
      healthData[d.Mental_Health_Issues]++;
    });
  }

  let healthArray = [];
  for (let prop in healthData) {
    let color;
    switch(prop) {
      case 'Yes': color = rgb(200, 0, 0); break;
      case 'No': color = rgb(46, 92, 155); break;
      case 'Unclear': color = rgb(198, 104, 21); break;
      default: color = rgb(43, 165, 63);
    }
    healthArray.push({
      name: prop,
      color,
      value: healthData[prop]
    });
  }

  createLegend(healthArray, pieDiv);

  let i = healthArray.length;
  while (i--) {
    if (healthArray[i].value === 0) {
      healthArray.splice(i, 1);
    }
  }

  let dy = -4;

  let g = pieSVG.selectAll('.arc')
      .data(pie(healthArray))
      .enter()
      .append('g')
      .attr('class', 'arc');

  g.append('path')
    .attr('d', arc)
    .style('fill', d => {
      return d.data.color;
    });

  // Center text
  g.append('text')
    .attr('dy', d => {
      dy += 2;
      return dy + 'em';
    })
    .text(d => {
      return `${d.data.name}: ${d.data.value}`;
    });

  // Ring text
  g.append('text')
    .attr('transform', d => {
      return `translate(${arc.centroid(d)})`;
    })
    .attr('dy', '0.35em')
    .text(d => {
      return `${d.data.name}`;
    });
}

function createLegend(healthArray, pieDiv) {
  let legend = pieDiv.append('svg')
    .attr('class', 'pieLegend')
    .style('opacity', 1)
    // .style('left', '50px')
    .style('top', '390px');

  let boxSize = 25;
  let yBox = boxSize;

  healthArray.forEach(d => {
    legend.append('rect')
    .attr('x', 25)
    .attr('y', yBox)
    .attr('width', boxSize)
    .attr('height', boxSize)
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5)
    .style('fill', d.color);

    legend.append('text')
      .attr('x', 60)
      .attr('y', () => {
        return yBox + boxSize * 0.75;
      })
      .text(d.name);

    yBox += 2 * boxSize;
  });

  pieDiv.append('h4')
    .html(`Legend`)
    .style('position', 'absolute')
    .style('top', '375px')
    .style('left', '95px');
}

function loadYear(year, allYears) {
  const maxYear = Math.max(...allYears);

  d3.selectAll('svg').remove();
  d3.select('#buttonDiv').remove();
  d3.select('#tooltip').remove();
  d3.select('#summaryBox').remove();
  d3.select('#pieDiv').remove();

  let buttonDiv = d3.select('#viz').append('div').attr('id', 'buttonDiv');

  buttonDiv.selectAll('button')
    .data(allYears)
    .enter()
    .append('button')
    .attr('type', 'button')
    .attr('class', d => {
      if (d === year) {
        return 'btn btn-danger';
      } else if (groupYears.includes(d)) {
        return 'btn btn-primary';
      } else {
        return 'btn btn-primary';
      }
      // return (d === year) ? 'btn btn-danger' : 'btn btn-primary';
    })
    .style('margin', '0.2%')
    .on('click', d => {
      loadYear(d, allYears);
    })
    .text(d => {
      return getYearText(d);
    });

  // for (let i = 0; i < allYears.length; i++) {
  //   const d = allYears[i];
  //   if (d === 1971 || d === 1982 || d === 1990 || d === 2000 || d === 2010) {
  //     buttonDiv.append('br');
  //   } else if (d === -1) {
  //     buttonDiv.append('br');
  //     buttonDiv.append('br');
  //   }
  //   buttonDiv.append('button')
  //     .attr('type', 'button')
  //     .attr('class', () => {
  //       if (d === year) {
  //         return 'btn btn-danger';
  //       } else if (groupYears.includes(d)) {
  //         return 'btn btn-primary';
  //       } else {
  //         return 'btn btn-primary';
  //       }
  //       // return (d === year) ? 'btn btn-danger' : 'btn btn-primary';
  //     })
  //     .style('margin', '0.2%')
  //     .on('click', () => {
  //       loadYear(d, allYears);
  //     })
  //     .text(() => {
  //       return getYearText(d);
  //     });
  // }
  createMap(year, allYears);
}

function getYearText(year) {
  switch(year) {
    case -1: return 'All Years';
    case -2: return '1960s';
    case -3: return '1970s';
    case -4: return '1980s';
    case -5: return '1990s';
    case -6: return '2000s';
    case -7: return '2010s';
    default: return year;
  }
}

function fixData(data) {
  data.forEach(d => {
    d.Fatalities = +d.Fatalities;
    d.Policeman_Killed = +d.Policeman_Killed;
    d.Injured = +d.Injured;
    d.Total_Victims = d.Fatalities + d.Policeman_Killed + d.Injured;
    if (d.Gender === 'Male') {
      d.Gender = 'M';
    } else if (d.Gender == 'Female') {
      d.Gender = 'F';
    }
    if (d.Mental_Health_Issues === 'unknown') {
      d.Mental_Health_Issues = 'Unknown';
    }
    if (!d.Age) {
      d.Age = 'Unknown';
    }
    if (!d.Employed) {
      d.Employed = 'Unknown';
    } else {
      d.Employed = (d.Employed === 1) ? 'Yes' : 'No';
    }
  });
}

function loadMap() {
  d3.csv('./data/all-shootings.csv', data => {
    fixData(data);
    const allYears = getAllYears(data);
    loadYear(Math.max(...allYears), allYears);
  });
}

window.onload = loadMap;

﻿import { Chart } from '../js/charts.js';
import * as Plot from "https://cdn.skypack.dev/@observablehq/plot@0.4";


const ChartAttributes = new Vue({
	el: '#Chart',
	data: {
		countiesDiv: document.getElementById('Counties'),
		chartArea: document.getElementById("ChartArea"),
		chartName: null,
		dataHolder: null,
		maxValue: 0,
		minValue: 0,
		year: 0,
		healthAttribute: null,
		healthAttributeData: [],
		selectedCounties: [],
		marks: [],
		plot: undefined,
	},
	methods: {
		/**
		 * 
		 * @param {number} year
		 */
		setChartAttributes(year) {
			this.year = year.target.value;
			//Get the columns div
			let healthAttrs = document.getElementById("HealthAttrs");
			let countiesDiv = document.getElementById("Counties");
			let checkHealthAttrs = this.checkIfNodeIsEmpty(healthAttrs);
			let checkCounties = this.checkIfNodeIsEmpty(countiesDiv);

			this.chart = Chart;


			if (checkCounties === false) {
				this.removeAllChildNodes(countiesDiv);
			}

			if (checkHealthAttrs === false) {
				this.removeAllChildNodes(healthAttrs);
			}

			d3.csv(`../uploads/${year.target.value}.csv`).then((data) => {

				let counties = this.getCountyList(data);

				//Place the csv data into a holder for later consumption 
				// this.dataHolder = data;

				this.addDataToUL(data.columns, healthAttrs, "radio"); // data.columns are the health attributes from the csv file.

				this.addDataToUL(counties, countiesDiv);
			});
		},
		/**
		 * 
		 * @param {any} data
		 * @param {any} ulId
		 * @param {any} inputType
		 */
		addDataToUL(data, ulId, inputType = "checkbox") {
			for (let i = 0; i < data.length; i++) {

				//Create list item for the input and label to be inserted into
				let liNode = document.createElement("li");

				liNode.classList = ["form-check"];

				//Create input node
				let nodeInput = document.createElement("input");

				nodeInput.type = inputType;
				nodeInput.value = data[i];
				nodeInput.id = data[i];
				nodeInput.classList = ["form-check-input"];
				nodeInput.name = ulId;

				//Label for the checkboxes
				let label = document.createElement('label');

				label.htmlFor = data[i];

				// append the created text to the created label tag
				label.appendChild(document.createTextNode(`${data[i]}`));

				// append the li to the ul div
				ulId.appendChild(liNode);

				// append the checkbox and label to the li's
				liNode.appendChild(nodeInput);
				liNode.appendChild(label);


			}
		},
		/**
		 * 
		 * @param {any} data
		 */
		getCountyList(data) {
			let listOfCounties = [];
			for (var i = 0; i < data.length; i++) {
				var countyWithState = `${data[i]["Name"]}, ${data[i]["State Abbreviation"]}`;
				listOfCounties.push(countyWithState);
			}
			return listOfCounties;
		},
		/**
		 * 
		 * @param {any} parent
		 */
		removeAllChildNodes(parent) {
			while (parent.firstChild) {
				parent.removeChild(parent.firstChild);
			}
		},
		checkIfNodeIsEmpty(node) {
			if (node.childNodes.length > 0) {
				return false;
			}
			return true;
		},
		async readHealthAttribute(clickEvent) {
			if (clickEvent["target"].nodeName === "LABEL") {

				this.healthAttribute = clickEvent["target"].textContent;

			} else if (clickEvent["target"].nodeName === "INPUT") {

				this.healthAttribute = clickEvent["target"].value;

			} else {

				console.error("The click event did not have a health attribute. Check the readHealthAttribute method.");
			}
		},
		readCountyCheckbox(clickEvent) {

			if (clickEvent["target"].checked) {
				let countyAndState = this.parseCountyAndStateName(clickEvent["target"].value);
				this.selectedCounties.push(clickEvent["target"].value);
			}

			if (!clickEvent["target"].checked) {
				let indexOfItemToRemove = this.selectedCounties.indexOf(clickEvent["target"].value);

				// as long as the item is found in the array, continue. 
				if (indexOfItemToRemove > -1) {
					// splice the item from the array to remove it. 
					this.selectedCounties.splice(indexOfItemToRemove, indexOfItemToRemove);
				}

				if (indexOfItemToRemove === 0) {
					this.selectedCounties.shift();
				}
			}
		},
		createInfoObjects(parsedCountStateArray) {

			let countyStateArray = [];

			// for each parsed county state
			for (let a = 0; a < parsedCountStateArray.length; a++) {
				//get the county state index
				let index = this.getCountStateIndex(parsedCountStateArray[a][0]);

				// get the county state information
				let info = this.getCountyInformation(parsedCountStateArray[a][0]);

				// get the county state percentile information
				let percentileInfo = this.getCountyStateDatapointPercentile(index);

				// create an object with collected information
				let newObject = { info, percentileInfo };
				console.log(newObject);

				// push the object to an array
				countyStateArray.push(newObject);
				console.log(`countStateArrayObject:`, countyStateArray);
            }


			//return the array of count state object information. 
			return countyStateArray;
		},
		creatPlotMarksArray(arrayOfObjects) {
			let marksArray = [Plot.line(this.healthAttributeData)];
			for (let a = 0; a < arrayOfObjects.length; a++) {
				// push plot dots to marks array
				marksArray.push(this.createPlotDots(arrayOfObjects[a]));
				// push plot text to marks array
				marksArray.push(this.createPlotText(arrayOfObjects[a]));
			}

			console.log("Marks Array: ", marksArray);
			return marksArray;
        },
		createPlotDots(countyStateObject) {
			// Plot.dot([93.95552771688067, 12212.33], { x: 93.95552771688067, y: 12212.33 })
			return Plot.dot([countyStateObject.percentileInfo[0], countyStateObject.percentileInfo[1]], { x: countyStateObject.percentileInfo[0], y: countyStateObject.percentileInfo[1] });
		},
		createPlotText(countyStateObject) {
			// Plot text example: Plot.text([93.95552771688067, 12212.33], { x: 93.95552771688067, y: 12212.33, text: ["testing"], dy: -8 })
			return Plot.text([countyStateObject.percentileInfo[0], countyStateObject.percentileInfo[1]], { x: countyStateObject.percentileInfo[0], y: countyStateObject.percentileInfo[1], text: [`${countyStateObject.info[0][1]} ${countyStateObject.info[0][2]} ${countyStateObject.info[0][3]}`], dy: -8 });
        },
		getCountyInformation(countyStateArray) {
			let countyStateInformation = this.dataHolder.filter(
				function findCountState(row) {
					
					if (row[1] == countyStateArray[0] && row[2] == countyStateArray[1]) {
						return row;
					}
				}
			);
			//console.log(countyStateInformation);
			return countyStateInformation;
        },
		getCountStateIndex(countyStateArray) {
			let index = this.dataHolder.findIndex(x => x[1] == countyStateArray[0] && x[2] == countyStateArray[1]);
			return index;
		},
		parseSelectedCountyStateArray() {
			let countyStateArray = [];
			for (var i = 0; i < this.selectedCounties.length; i++) {
				let parsed = this.parseCountyAndStateName(this.selectedCounties[i]);
				countyStateArray.push([parsed]);
			}

			return countyStateArray;
        },
		redrawChart(plotMarksArray) {
			this.removeAllChildNodes(this.chartArea);

			this.plot = Plot.plot({
				x: {
					label: "Percentile →"
				},
				y: {
					label: `↑ ${this.healthAttribute}`
				},
				marks: plotMarksArray
			});

			this.chartArea.appendChild(this.plot);
		},
		getCountyStateDatapointPercentile(indexOfCountyState) {
			return this.healthAttributeData[indexOfCountyState];
        },
		parseCountyAndStateName(countyState) {
			var split = countyState.split(",");

			split[0] = split[0].trim();
			split[1] = split[1].trim();

			return split;
		}
	},
	watch: {
	   async healthAttribute() {
			this.chartArea = document.getElementById("ChartArea");

			this.removeAllChildNodes(this.chartArea);
			if (this.healthAttribute !== null) {

				this.dataHolder = await d3.csv(`../uploads/${this.year}.csv`)
					.then((data) => {
						return data.map((x) => [Number(x[this.healthAttribute]), x["Name"], x["State Abbreviation"], x["5-digit FIPS Code"]]);
					});
				//console.log(this.dataHolder);

				//let index = this.dataHolder.indexOf((d) => d[1] == "Washington", d[2] == "TN");

				this.dataHolder.sort((a, b) => a[0] - b[0]);

				this.healthAttributeData = this.dataHolder.map((element, index) => ([(index / this.dataHolder.length * 100), element[0]]));

				this.chartArea = document.getElementById("ChartArea");

				//console.log(this.healthAttributeData);

				this.plot = Plot.plot({
					x: {
						label: "Percentile →"
					},
					y: {
						label: `↑ ${this.healthAttribute}`
					},
					marks: [
						Plot.line(this.healthAttributeData),
					]
				});

				this.chartArea.appendChild(this.plot);
			}
		},
		selectedCounties() {
			//console.log(this.selectedCounties);
			//let parsedArray = this.parseSelectedCountyStateArray();
			//this.getCountStateIndex(parsedArray);

			let parsedArray = this.parseSelectedCountyStateArray(); // loop through all the selected counties and split the county and state names into an array: [["Washington County", "TN"], ["Sullivan County", "TN"]];

			//create object with information to be plotted. 
			let arrayOfObjects = this.createInfoObjects(parsedArray);

			// create the plot marks: Dots and Text.
			let plotMarksArray = this.creatPlotMarksArray(arrayOfObjects);

			// Redraw the chart
			this.redrawChart(plotMarksArray);
		}
	}
})
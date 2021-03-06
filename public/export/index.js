/*
This project is deliberately vanilla javascript.
*/

const $ = (selector, context) => {
	const found = (context || document).querySelectorAll(selector);
	return found.length > 0 ? Array.from(found) : [];
};

const $1 = (selector, context) => {
	const found = (context || document).querySelector(selector);
	return found;
};

const init = async () => {
	const dynamicFieldAddTemplate = $1('#dynamic-field-template').content;

	const $exportForm = $1('#export-form');
	const $exportDataFormat = $1('#export-data-format');
	const $resultsHeading = $1("#results-heading");

	const $searchForm = $1('#search-form');
	const $searchCategoryField = $1('#search-category-field');
	const $searchCaseSetField = $1('#search-case-set-field');
	const $searchStartDate = $1('#search-start-date');
	const $searchEndDate = $1('#search-end-date');

	const $dynamicFields = $1('.dynamic-fields');

	const $dynamicKeywords = $1('#dynamic-keywords');
	const $dynamicKeywordsAdd = $1('#dynamic-keywords-add');
	const $keywordsFields = $1('#keywords-fields');

	const $ugcColumns = $1('#ugc-columns');

	const $results = $1('#results');
	const $resultsTable = $1('#results-table');

	const ugcColumnsData = await fetch('/api/export/columns').then((c) => c.json());

	ugcColumnsData.forEach((col) => {
		const label = document.createElement('label');
		label.innerHTML = `<input type="checkbox" class="ugc-column" value="${col.id}" />${col.name}`;
		$ugcColumns.appendChild(label);
	});

	const caseSets = await fetch('/api/human-refinement/case-sets').then(c => c.json());

	caseSets.forEach((caseSet, i) => {

		const option = document.createElement('option');
		option.value = caseSet.id;
		option.text = `[${(i + 1)}] ${caseSet.id}`;
		$searchCaseSetField.appendChild(option);

	})

	const exportData = async (params) => {
		window.open(`/api/export/search?` + params.toString(), '_blank');
	};

	const search = (params) => {
		$resultsTable.innerHTML = '';
		params.set('preview', true);
		fetch(`/api/export/search?` + params.toString())
			.then((t) => t.json())
			.then((results) => {
				$resultsHeading.classList.add('active')
				$results.style.display = 'block';
				if (results.total > 0) {
					results.columns = results.columns.slice(1);
					results.rows = results.rows.map((a) => a.slice(1));

					const tr = document.createElement('tr');
					$resultsTable.appendChild(tr);
					results.columns.forEach((col) => {
						const th = document.createElement('th');
						th.innerText = col;
						tr.appendChild(th);
					});

					results.rows.forEach((row) => {
						const tr = document.createElement('tr');
						$resultsTable.appendChild(tr);
						row.forEach((col) => {
							const td = document.createElement('td');
							if (typeof col === 'object') {
								if (col !== null && col.length > 0) {
									td.innerHTML = `<details><summary>Details</summary><pre>${JSON.stringify(
										col,
										null,
										4
									)}</pre></details>`;
								} else {
									td.innerHTML = 'null';
								}
							} else if (Array.isArray(col) && col.length > 1) {
								td.innerHTML = `<ul>`;
								col.forEach((c) => {
									td.innerHTML += `<li>${c}</li>`;
								});
								td.innerHTML += `</ul>`;
							} else {
								td.innerText = col;
							}
							tr.appendChild(td);
						});
					});
				}
			});
	};

	const compileParams = () => {
		const $fixedColumns = $('.fixed-column:checked');
		const $ugcColumns = $('.ugc-column:checked');
		const params = new URLSearchParams();

		params.set('category', $searchCategoryField.value);
		params.set('caseSetId', $searchCaseSetField.value)
		if ($searchStartDate.value) {
			params.set('startDate', $searchStartDate.value);
		}
		if ($searchEndDate.value) {
			params.set('endDate', $searchEndDate.value);
		}
		if ($fixedColumns.length > 0) {
			params.set(
				'fixedColumns',
				$fixedColumns.map((f) => f.value)
							.join(',')
			);
		}

		if ($ugcColumns.length > 0) {
			params.set(
				'ugcColumns',
				$ugcColumns.map((f) => f.value)
				.join(',')
			
			);
		}

		let $activeKeywordsFields = $('.dynamic-field', $keywordsFields);
		
		if ($dynamicKeywords.checked && $activeKeywordsFields.length > 0) {
			const keywordsFields = Array.from($activeKeywordsFields)
				.map((f) => f.value)
				.join(',');
			params.set('keywordsFields', keywordsFields);
		}

		return params;
	};

	$exportForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const params = compileParams();
		params.set('exportData', $exportDataFormat.value);
		exportData(params);
	});

	$searchForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const params = compileParams();
		window.history.pushState({}, '', `${location.pathname}?${params}`);
		search(params);
	});

	
	$dynamicFields.addEventListener('click', (e) => {
		if (e.target.classList.contains('dynamic-field-delete')) {
			e.target.parentNode.remove();
		}
	})


	$dynamicKeywordsAdd.addEventListener('click', () => {
		$keywordsFields.appendChild(dynamicFieldAddTemplate.cloneNode(true));
	});

	if (window.location.search) {
		const initialParams = new URLSearchParams(window.location.search);

		$searchCategoryField.value = initialParams.get('category') || 'All';
		$searchStartDate.value = initialParams.get('startDate');
		$searchEndDate.value = initialParams.get('endDate');
		
		const caseSetId = initialParams.get('caseSetId');
		if(caseSetId) {
			$searchCaseSetField.value = caseSetId;
		}

		const fixedColumns = initialParams.get('fixedColumns');

		if (fixedColumns) {
			fixedColumns.split(',').forEach((f) => {
				const $checkbox = $1(`.fixed-column[value=${f}]`);
				$checkbox.checked = true;
			});
		}

		const ugcColumns = initialParams.get('ugcColumns');

		if (ugcColumns) {
			ugcColumns.split(',').forEach((f) => {
				const $checkbox = $1(`.ugc-column[value="${f}"]`);
				$checkbox.checked = true;
			});
		}

		const keywordsFields = initialParams.get('keywordsFields');
		if (keywordsFields) {
			$dynamicKeywords.checked = true;
			keywordsFields.split(',').forEach((f) => {
				const keywordsField = dynamicFieldAddTemplate.cloneNode(true);
				$1('input', keywordsField).value = f;
				$keywordsFields.appendChild(keywordsField);
			});
		}

		search(initialParams);
	}

	document.querySelector('.loading').classList.remove('loading');
};

window.onload = init;

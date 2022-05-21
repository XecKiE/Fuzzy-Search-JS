/**
 * Create a fuzzy search on an element
 * @param {dom}      _d_parent  The parent dom element (should follow the structure given in the sample)
 * @param {mixed}    _data      An array list of the elements to search, or null if the data is in the datalist (see structure given in the sample), they should have the following structure :  {key: UNIQUE_ID, fuzzy: [EXTRA_SEARCHABLE_STRING], label: LABEL_OF_THE_ROW}
 * @param {object}   _options   Options for the Fuzzy Search, as seen bellow :
 *                              * datalist_separator: The datalist separator to be used - default: |
 *                              * on_select: The callback function to be called when an element is selected
 *                              * on_back : The callback function to be called when the Shift+Tab combinaison is pressed
 */
class Fuzzy {
	constructor(_d_parent, _data = null, _options = {}) {
		this.options = _options;
		this.d_parent = _d_parent;
		this.d_selected = null;
		this.current = null;
		this.selected = null;

		this.set_data(_data);

		var t = this.d_parent.getElementsByTagName('input');
		if(t.length) {
			this.d_input = t[0];
		} else {
			this.d_input = document.createElement('input');
			this.d_parent.insertAdjacentElement('afterbegin', this.d_input);
		}

		var t = this.d_parent.getElementsByClassName('fuzzy_dropdown');
		if(t.length) {
			this.d_dropdown = t[0];
		} else {
			this.d_dropdown = document.createElement('div');
			this.d_dropdown.classList.add('fuzzy_dropdown');
			this.d_parent.insertAdjacentElement('beforeend', this.d_dropdown);
		}
		this.d_dropdown.style.display = 'none';

		(function(parent) {
			parent.d_parent.addEventListener('mousedown', function() {
				if(!parent.d_input.disabled) {
					setTimeout(function() {parent.focus();}, 0);
				}
				event.preventDefault();
			});

			parent.d_input.addEventListener('focus', function() {
				setTimeout(function() {parent.focus();}, 0);
			});

			parent.d_input.addEventListener('focusout', function() {
				setTimeout(function() {parent.focusout();}, 0);
			});

			parent.d_input.addEventListener('keydown', function(event) {
				if((event.key == 'Tab' && !event.shiftKey) || event.key == 'Enter') {
					parent._select(event);
					event.preventDefault();
				} else if((event.key == 'Tab' && event.shiftKey) || event.key == 'Escape') {
					parent.focusout();
					event.preventDefault();
					if(parent.options.on_back) {
						parent.options.on_back(event);
					}
				} else if(event.key == 'ArrowDown') {
					if(parent.d_selected.nextElementSibling) {
						parent.d_selected.className = '';
						parent.d_selected = parent.d_selected.nextElementSibling;
						parent.d_selected.className = 'fuzzy_selected';
						if(parent.d_selected.offsetTop+parent.d_selected.offsetHeight > parent.d_dropdown.clientHeight+parent.d_dropdown.scrollTop) {
							parent.d_selected.scrollIntoView(false);
						} else if(parent.d_selected.offsetTop < parent.d_dropdown.scrollTop) {
							parent.d_selected.scrollIntoView(true);
						}
					}
					event.preventDefault();
				} else if(event.key == 'ArrowUp') {
					if(parent.d_selected.previousElementSibling) {
						parent.d_selected.className = '';
						parent.d_selected = parent.d_selected.previousElementSibling;
						parent.d_selected.className = 'fuzzy_selected';
						if(parent.d_selected.offsetTop+parent.d_selected.offsetHeight > parent.d_dropdown.clientHeight+parent.d_dropdown.scrollTop) {
							parent.d_selected.scrollIntoView(false);
						} else if(parent.d_selected.offsetTop < parent.d_dropdown.scrollTop) {
							parent.d_selected.scrollIntoView(true);
						}
					}
					event.preventDefault();
				} else {
					setTimeout(function() {parent.current = parent.d_input.value; parent.refresh_dropdown();}, 0);
				}
			});

		})(this);
	}

	focus() {
		if(this.d_dropdown.style.display == 'none') {
			this.d_input.focus();
			this.d_input.value = this.current;
			this.refresh_dropdown();
			this.d_dropdown.style.display = 'block';
		}
	}

	focusout() {
		if(this.d_dropdown.style.display == 'block') {
			this.d_input.blur();
			this.d_input.value = '';
			if(this.selected !== null) {
				for(var i=0 ; i<this.data.length ; i++) {
					if(this.data[i].key == this.selected) {
						this.d_input.value = this.data[i].label;
						break;
					}
				}
			}
			this._empty_dropdown();
			this.d_dropdown.style.display = 'none';
		}
	}

	set_data(_data) {
		if(_data !== null) {
			this.data = _data;
		} else {
			this.data = [];
			var t = this.d_parent.getElementsByTagName('datalist');
			for(var i=0 ; i<t.length ; i++) {
				for(var j=0 ; j<t[i].options.length ; j++) {
					this.data.push({
						key: t[i].options[j].value,
						fuzzy: (t[i].options[j].dataset.fuzzy !== undefined && t[i].options[j].dataset.fuzzy != '' ? t[i].options[j].dataset.fuzzy.split(this.options.datalist_separator || '|') : []),
						label: t[i].options[j].text
					});
				}
			}
		}
	}

	_select_key(dom) {
		this.d_selected.className = '';
		this.d_selected = dom;
		this.d_selected.className = 'fuzzy_selected';
	}

	_valid_key(dom, event) {
		if(dom == this.d_selected) {
			this._select(event);
		}
	}

	_select(event) {
		if(this.d_selected !== null) {
			this.selected = this.d_selected.dataset.key;
			this.focusout();
			if(this.options.on_select) {
				this.options.on_select(this.d_selected.dataset.key, event);
			}
		}
	}

	refresh_dropdown() {
		var pattern = this.d_input.value;
		if(pattern !== '') {

			//For each element to sort
			for(var i=0 ; i<this.data.length ; i++) {
				var t = [this.data[i].label],
					sf = -11111111,
					indexes,
					sfg = '';
				if(typeof this.data[i].fuzzy != 'undefined') {
					for(var j=0 ; j<this.data[i].fuzzy.length ; j++) {
						t.push(this.data[i].fuzzy[j]);
					}
				}

				//Search for the best match available between strings
				for(var l=0 ; l<t.length ; l++) {
					var s=0, p=0,
						str = t[l].split(''),
						str_normalized = t[l].normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(''),
						str_normalized_lower = t[l].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(''),
						str_lower = t[l].toLowerCase().split(''),
						str_upper = t[l].toUpperCase().split(''),
						pat = pattern.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(''),
						typo1 = false,
						typo2 = false,
						cs = 0,
						indexes1 = [],
						indexes2 = [],
						found1 = false,
						found2 = false,
						ci = null,
						tmp;
					//First we get all approximate matches (letters all presents in the right order, with one order typo max)
					while(true) {
						if(p == pat.length) {
							//Found string
							found1 = true;
							break;
						} else if(s == str.length) {
							//Didn't found string, test next typo
							if(p < 2) {
								break;
							} else if(typo1 === false) {
								typo1 = p;
							} else if(typo1 > 2) {
								typo1--;
								tmp = pat[typo1];
								pat[typo1] = pat[typo1+1];
								pat[typo1+1] = tmp;
							} else {
								break;
							}
							s = typo1>1?indexes1[typo1-2]:0;
							indexes1.splice(typo1-1);
							p = typo1-1;
							tmp = pat[typo1];
							pat[typo1] = pat[p];
							pat[p] = tmp;
						} else {
							if(pat[p] == str_normalized_lower[s]) {
								indexes1.push(s)
								p++;
							}
							s++;
						}
					}

					if(!found1) {
						continue;
					}

					pat = pattern.split('');
					s=0; p=0;

					//Then we get all strict matches (only start of word or consecutive letters) (letters all presents in the right order, with one order typo max)
					while(true) {
						if(p == pat.length) {
							//Found string
							found2 = true;
							break;
						} else if(s == str.length) {
							//Didn't found string, test next typo
							if(p < 1) {
								break;
							} else if(typo2 === false) {
								typo2 = p;
							} else if(typo2 > 2) {
								typo2--;
								tmp = pat[typo2];
								pat[typo2] = pat[typo2+1];
								pat[typo2+1] = tmp;
							} else {
								break;
							}
							s = typo2>0?indexes2[typo2-1]:0;
							indexes2.splice(typo2-1);
							p = typo2-1;
							tmp = pat[typo2];
							pat[typo2] = pat[p];
							pat[p] = tmp;
						} else {
							if(pat[p] == str_normalized_lower[s] &&
								(
									s == 0 ||
									(str_lower[s-1] == str_upper[s-1]) ||
									(str[s] == str_upper[s] && str[s-1] == str_lower[s-1]) || 
									(indexes2[p-1] == s-1)
								)) {
								indexes2.push(s);
								p++;
							}
							s++;
						}
					}

					//Get the correct indexes
					if(found2) {
						ci = indexes2;
					} else {
						ci = indexes1;
					}

					//Score calculation
					var last = -1;
					for(var k=0 ; k<ci.length ; k++) {
						if(last !== ci[k]) {
							cs -= ci[k];
						}
						last = ci[k];
					}

					if(found2) {
						if(typo2) {
							cs -= 20;
						}
					} else {
						cs *= 1000;
						if(typo1) {
							cs -= 20;
						}
					}
					cs -= t[l].length - pattern.length;

					//Get the best results
					if(cs > sf) {
						sf = cs;
						indexes = ci;
						sfg = t[l];
					}
				}
				this.data[i].fuzzy_score = sf;
				if(sfg != this.data[i].label) {
					this.data[i].fuzzy_ghost = sfg;
				} else {
					this.data[i].fuzzy_ghost = '';
				}
			}
			this.data.sort(function(a, b) {return (b.fuzzy_score!=a.fuzzy_score?b.fuzzy_score-a.fuzzy_score:a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'}));});
		} else {
			for(var i=0 ; i<this.data.length ; i++) {
				this.data[i].fuzzy_score = 0;
				this.data[i].fuzzy_ghost = '';
			}
			this.data.sort(function(a, b) {return /*a.label < b.label;*//*if speed is not an issue : */a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'});});
		}
		while (this.d_dropdown.firstElementChild) {
			this.d_dropdown.removeChild(this.d_dropdown.firstElementChild);
		}
		if(this.d_selected != null) {
			var previous_key = this.d_selected.dataset.key;
		}
		this.d_selected = null;
		for(var i=0 ; i<this.data.length ; i++) {
			//TODO, Faire ça dans un timeout
			//TODO, Réutiliser les div précédents, et en les réordonant, peut-être en les stockants dans une variable
			if(this.data[i].fuzzy_score == -11111111) {
				break;
			}
			var d = document.createElement('div');
			d.textContent = this.data[i].label;
			if(this.data[i].fuzzy_ghost) {
				d.textContent += ' ['+this.data[i].fuzzy_ghost+']';
			}
			d.dataset.key = this.data[i].key;
			(function(parent, d) {d.addEventListener('mousedown', function() {parent._select_key(this);})})(this, d);
			(function(parent, d) {d.addEventListener('click', function(event) {parent._valid_key(this, event);})})(this, d);
			if(previous_key == this.data[i].key) {
				d.className = 'fuzzy_selected';
				this.d_selected = d;
			}
			this.d_dropdown.appendChild(d);
		}
		if(this.d_selected === null && this.data.length > 0) {
			this.d_selected = this.d_dropdown.firstElementChild;
			if(this.d_selected !== null) {
				this.d_selected.className = 'fuzzy_selected';
			}
		}
		if(this.d_selected !== null) {
			this.d_selected.scrollIntoView(false);
		}
	}

	_empty_dropdown() {
		while (this.d_dropdown.firstElementChild) {
			this.d_dropdown.removeChild(this.d_dropdown.firstElementChild);
		}
	}
}

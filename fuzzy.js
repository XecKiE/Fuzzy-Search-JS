/**
 * Create a fuzzy search on an element
 * @param      {dom} _d_parent  The parent dom element (should follow the structure given in the sample)
 * @param    {array} _data      An array list of the elements to search, they should have the following structure : {key: UNIQUE_ID, fuzzy: [EXTRA_SEARCHABLE_STRING], label: LABEL_OF_THE_ROW}
 * @param {function} _on_select When an element is selected, this function will be called
 * @param {function} _on_goback When an element is selected, this function will be called
 */
class Fuzzy {
	constructor(_d_parent, _data, _on_select, _on_goback) {
		this.d_parent = _d_parent;
		this.data = _data;
		this.on_select = _on_select;
		this.on_goback = _on_goback;
		this.breadcrumb = [];
		var t = this.d_parent.getElementsByClassName('fuzzy_text');
		if(t.length) {
			this.d_text = t[0];
		}
		var t = this.d_parent.getElementsByClassName('fuzzy_breadcrumb');
		if(t.length) {
			this.d_breadcrumb = t[0];
		}
		var t = this.d_parent.getElementsByClassName('fuzzy_input');
		if(t.length) {
			this.d_input = t[0];
		}
		var t = this.d_parent.getElementsByClassName('fuzzy_dropdown');
		if(t.length) {
			this.d_dropdown = t[0];
		}

		(function(parent) {
			parent.d_parent.addEventListener('mousedown', function() {
				setTimeout(function() {parent.get_focus();}, 0);
			});
			parent.d_dropdown.addEventListener('scroll', function() {
				setTimeout(function() {parent.get_focus();}, 0);
			});
			parent.d_input.addEventListener('keydown', function(event) {
				if((event.key == 'Tab' && !event.shiftKey) || event.key == 'Enter') {
					parent.select();
					event.preventDefault();
				} else if((event.key == 'Tab' && event.shiftKey)
					|| (event.key == 'Backspace' && parent.d_input.value == '')) {
					parent.back();
					event.preventDefault();
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
					setTimeout(function() {parent.refresh_dropdown();}, 0);
				}
			});
		})(this);

		this.refresh_breadcrumb();
		this.refresh_dropdown();
	}

	select_key(dom) {
		this.d_selected.className = '';
		this.d_selected = dom;
		this.d_selected.className = 'fuzzy_selected';
	}

	valid_key(dom) {
		if(dom == this.d_selected) {
			this.select();
		}
	}

	select() {
		var selected = false;
		for(var i=0 ; i<this.data.length ; i++) {
			if(this.data[i].key == this.d_selected.dataset.key) {
				selected = this.data[i];
				break;
			}
		}
		if(selected) {
			this.breadcrumb.push({
				key: selected.key,
				label: selected.label
			});
			this.d_input.value = '';
			this.on_select(this.d_selected.dataset.key);
			this.refresh_breadcrumb();
		}
	}

	back(index) {
		var index, key;
		if(typeof index == 'undefined') {
			index = this.breadcrumb.length-2;
		}
		if(index < 0) {
			key = '/';
		} else {
			key = this.breadcrumb[index].key;
		}
		for(var i=0 ; i<this.breadcrumb.length-index-1 ; i++) {
			this.d_breadcrumb.lastChild.remove();
		}
		this.breadcrumb.splice(index+1);
		this.d_input.value = '';
		this.on_goback(key);
		this.refresh_breadcrumb();
	}

	refresh_breadcrumb() {
		if(!this.d_breadcrumb.firstElementChild) {
			var t = document.createElement('span');
			t.innerHTML = '&gt;&nbsp;';
			(function(parent) {
				t.addEventListener('click', function() {parent.back(-1);});
			})(this);
			this.d_breadcrumb.appendChild(t);
		}
		var d = this.d_breadcrumb.firstElementChild;
		for(var i=0 ; i<this.breadcrumb.length ; i++) {
			if(!d.nextElementSibling) {
				var t = document.createElement('span');
				t.innerHTML = this.breadcrumb[i].label+'&nbsp;&gt;&nbsp;';
				(function(parent, index) {
					t.addEventListener('click', function() {parent.back(index);});
				})(this, i);
				this.d_breadcrumb.appendChild(t);
			}
			d = d.nextElementSibling;
		}
	}

	refresh_dropdown() {
		var pattern = this.d_input.value;
		if(pattern !== '') {
			for(var i=0 ; i<this.data.length ; i++) {
				var t = [this.data[i].label],
					sf = -11111111,
					sfg = '';
				if(typeof this.data[i].fuzzy != 'undefined') {
					for(var j=0 ; j<this.data[i].fuzzy.length ; j++) {
						t.push(this.data[i].fuzzy[j]);
					}
				}
				for(var l=0 ; l<t.length ; l++) {
					var s = 0;
					var pm = true;
					var k = 0;
					for(var j=0 ; j<t[l].length ; j++) {
						if(k < pattern.length && t[l].charAt(j).toLowerCase() == pattern.charAt(k).toLowerCase()) {
							if(pm) {
								s += 5;
							}
							if(j == 0) {
								s += 10;
							} else if((t[l].charAt(j-1) < 'a' || t[l].charAt(j-1) > 'z') && (t[l].charAt(j-1) < 'A' || t[l].charAt(j-1) > 'Z')) {
								s += 10;
							} else if((t[l].charAt(j-1) > 'a' && t[l].charAt(j-1) < 'z') && (t[l].charAt(j) > 'A' && t[l].charAt(j) < 'Z')) {
								s += 10;
							}
							pm = true;
							k++;
						} else {
							pm = false;
							s--;
						}
					}
					if(k >= pattern.length && s > sf) {
						sf = s;
						sfg = t[l];
					}
				}
				this.data[i].fuzzy_score = sf;
				this.data[i].fuzzy_ghost = (sfg!=this.data[i].label ? sfg : '');
			}
			this.data.sort(function(a, b) {return (b.fuzzy_score!=a.fuzzy_score?b.fuzzy_score-a.fuzzy_score:a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'}));});
		} else {
			for(var i=0 ; i<this.data.length ; i++) {
				this.data[i].fuzzy_score = 0;
				this.data[i].fuzzy_ghost = '';
			}
			this.data.sort(function(a, b) {return a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'});});
		}
		while (this.d_dropdown.firstElementChild) {
			this.d_dropdown.removeChild(this.d_dropdown.firstElementChild);
		}
		for(var i=0 ; i<this.data.length ; i++) {
			if(this.data[i].fuzzy_score == -11111111) {
				break;
			}
			var d = document.createElement('div');
			d.innerHTML = this.data[i].label;
			if(this.data[i].fuzzy_ghost) {
				d.innerHTML += ' ['+this.data[i].fuzzy_ghost+']';
			}
			d.dataset.key = this.data[i].key;
			(function(parent, d) {d.addEventListener('mousedown', function() {parent.select_key(this);})})(this, d);
			(function(parent, d) {d.addEventListener('click', function() {parent.valid_key(this);})})(this, d);
			if(i == 0) {
				d.className = 'fuzzy_selected';
				this.d_selected = d;
			}
			this.d_dropdown.appendChild(d);
		}
	};

	get_focus() {
		this.d_input.focus();
	};

	/**
	 * Set a new array to use
	 * @param {array} _data An array list of the elements to search, they should have the same structure as the constructor
	 */
	set_data(_data) {
		this.data = _data;
		this.refresh_dropdown();
	}
}
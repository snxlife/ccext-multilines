const { Extension, type, api } = require('clipcc-extension');



class Formatter {
    static Formatters = {
        "null": str => str,
        "replace": (str, args) => str.replaceAll(args.from[0], args.to[0]),
    };
    constructor (type, args) {
        this.type = type;
        this.args = args;
    }
    format (str) {
        return Formatter.Formatters[this.type](str, this.args);
    }
    toString () {
        return `<Formatter::${this.type.toUpperCase()}>`;
    }
}

class Multilines extends Extension {
	// @position 0 0 @size "200px" "100px" @resize "none"
	static DEFUALT_STATE_PARAM = {
		position: ["25%", "25%"],
		size: ["50%", "50%"],
		resize: ["none"],
		description: ["Something here..."],
	};
	static STATIC_FIELD_STYLES = {
		light_rounded: `
border: 1px solid #cccccc;
padding: 4px;
border-radius: 4px;
color: #333333;
outline: none;
        `,
		light: `
border: 1px solid #cccccc;
padding: 4px;
color: #333333;
outline: none;
        `,
		dark_rounded: `
border: 1px solid #333333;
padding: 4px;
border-radius: 4px;
color: #cccccc;
outline: none;
background-color: #111111;
        `,
		dark: `
border: 1px solid #333333;
padding: 4px;
color: #cccccc;
outline: none;
background-color: #111111;
        `,
	};
	_err(code, msg) {
		this.error.code = code;
		this.error.msg = msg;
	}
	_clearErr() {
		this.error.code = 0;
		this.error.msg = "";
	}
	_getStageElement() {
		this.$ = document.querySelector("div.stage_stage_1fD7k.box_box_2jjDp");
		if (!this.$) {
			return this._err(1, `Unable to get the stage context.`);
		}
		this._err(0, "");
	}
	_spilt(str, by) {
		let i = 0;
		let res = [];
		while (i < str.length) {
			while (i < str.length && by.indexOf(str[i]) !== -1) {
				++i;
			}
			res.push("");
			if ("'\"".includes(str[i])) {
				res[res.length - 1] += '"';
				++i;
				let ig = false;
				while (i < str.length && !("'\"".includes(str[i]) && !ig)) {
					res[res.length - 1] += str[i];
					ig = false;
					if (str[i] === "\\") {
						ig = true;
					}
					++i;
				}
				res[res.length - 1] += '"';
				++i;
			} else {
				while (i < str.length && by.indexOf(str[i]) === -1) {
					res[res.length - 1] += str[i];
					++i;
				}
			}
		}
		return res;
	}
	_getParam(param) {
		let params = this._spilt(param, [",", " "]);
		let res = {};
		let curr_key;
		for (const val of params) {
			if (val[0] === "@") {
				curr_key = val.slice(1);
				if (!res[curr_key]) res[curr_key] = [];
			} else {
				if (curr_key) res[curr_key].push(JSON.parse(`{"val": ${val}}`).val);
			}
		}
		return res;
	}
	_fillWith(A, B) {
		for (const k in B) {
			if (!A[k]) {
				A[k] = B[k];
			}
		}
		return A;
	}
	updateField(ID) {
		if (!this.fields[ID]) {
			return this._err(3, `Field \`${ID}\` hasn't created.`);
		}
		let state = this.fields[ID].state;
		let $textarea = this.fields[ID].$html;
		$textarea.style = `
max-width: 100%;
max-height: 100%;
min-width: ${state.size[0]};
min-height: ${state.size[1]};
width: ${state.size[0]};
height: ${state.size[1]};
position: absolute;
top: ${state.position[0]};
left: ${state.position[1]};
resize: ${state.resize[0]};
${this.fields[ID].style};
        `;
		$textarea.setAttribute("placeholder", state.description);
	}
	errorCode() {
		return this.error.code;
	}
	errorMsg() {
		return this.error.msg;
	}
	getFormatter({ FORMATTER, ARGS }) {
		this._clearErr();
		switch (FORMATTER) {
			case "replace":
				return new Formatter("replace", this._getParam(ARGS));
			default:
				return new Formatter("null", {});
		}
	}
	addField({ ID, STATE }) {
		this._clearErr();
		if (this.fields[ID]) {
			return this._err(2, `Field \`${ID}\` has already created.`);
		}
		let state = this._fillWith(
			this._getParam(STATE),
			Multilines.DEFUALT_STATE_PARAM
		);
		let $textarea = document.createElement("textarea");
		$textarea.style = `
width: ${state.size[0]};
height: ${state.size[1]};
position: absolute;
top: ${state.position[0]};
left: ${state.position[1]};
resize: ${state.resize[0]};
        `;
		$textarea.setAttribute("placeholder", state.description);
		this.$.appendChild($textarea);
		this.fields[ID] = {
			id: ID,
			$html: $textarea,
			state: state,
			_state: STATE,
			style: "",
		};
	}
	setFieldStyle({ ID, STYLE }) {
		this._clearErr();
		if (!this.fields[ID]) {
			return this._err(3, `Field \`${ID}\` hasn't created.`);
		}
		this.fields[ID].style = STYLE;
		this.updateField(ID);
	}
	setFieldState({ ID, STATE }) {
		this._clearErr();
		if (!this.fields[ID]) {
			return this._err(3, `Field \`${ID}\` hasn't created.`);
		}
		let state = this._fillWith(
			this._getParam(STATE),
			Multilines.DEFUALT_STATE_PARAM
		);
		this.fields[ID].state = state;
		this.fields[ID]._state = STATE;
		this.updateField(ID);
	}
	setFieldValue({ ID, VALUE }) {
		this._clearErr();
		if (!this.fields[ID]) {
			return this._err(3, `Field \`${ID}\` hasn't created.`);
		}
		this.fields[ID].$html.value = VALUE;
	}
	getFieldState({ ID, KEY }) {
		this._clearErr();
		if (!this.fields[ID]) {
			this._err(3, `Field \`${ID}\` hasn't created.`);
			return "";
		}
		if (KEY) {
			let key = KEY.split(".");
			return this.fields[ID].state[key[0]][key[1]];
		}
		return this.fields[ID]._state;
	}
	getFieldValue({ ID, FORMATTER }) {
		this._clearErr();
		if (!this.fields[ID]) {
			this._err(3, `Field \`${ID}\` hasn't created.`);
			return "";
		}
		if (typeof FORMATTER === "string") {
			return this.fields[ID].$html.value;
		}
		return FORMATTER.format(this.fields[ID].$html.value);
	}
	removeField({ ID }) {
		this._clearErr();
		if (!this.fields[ID]) {
			return this._err(3, `Field \`${ID}\` hasn't created.`);
		}
		this.$.removeChild(this.fields[ID].$html);
		delete this.fields[ID];
	}
	getStaticStyle({ TYPE }) {
		return Multilines.STATIC_FIELD_STYLES[TYPE] || "";
	}
	onInit() {
		this.error = { code: 0, msg: "" };
		this._clearErr();
		this.fields = {};
		this._getStageElement();
		api.addCategory({
			categoryId: "qiming.multilines.category",
			messageId: "qiming.multilines.category",
			color: "#ffcc66",
		});
		api.addBlocks([
			{
				opcode: "qiming.multilines.error_code",
				type: type.BlockType.REPORTER,
				messageId: "qiming.multilines.error_code",
				categoryId: "qiming.multilines.category",
				function: (args) => this.errorCode(args),
			},
			{
				opcode: "qiming.multilines.error_msg",
				type: type.BlockType.REPORTER,
				messageId: "qiming.multilines.error_msg",
				categoryId: "qiming.multilines.category",
				function: (args) => this.errorMsg(args),
			},
			{
				opcode: "qiming.multilines.add_field",
				type: type.BlockType.COMMAND,
				messageId: "qiming.multilines.add_field",
				categoryId: "qiming.multilines.category",
				param: {
					ID: {
						type: type.ParameterType.STRING,
						default: "MyField",
					},
					STATE: {
						type: type.ParameterType.STRING,
						default:
							'@position "25%" "25%" @size "50%" "50%" @resize "none" @description "Enjoy typing..."',
					},
				},
				function: (args) => this.addField(args),
			},
			{
				opcode: "qiming.multilines.set_field_style",
				type: type.BlockType.COMMAND,
				messageId: "qiming.multilines.set_field_style",
				categoryId: "qiming.multilines.category",
				param: {
					ID: {
						type: type.ParameterType.STRING,
						default: "MyField",
					},
					STYLE: {
						type: type.ParameterType.STRING,
						default: "color: red;",
					},
				},
				function: (args) => this.setFieldStyle(args),
			},
			{
				opcode: "qiming.multilines.set_field_state",
				type: type.BlockType.COMMAND,
				messageId: "qiming.multilines.set_field_state",
				categoryId: "qiming.multilines.category",
				param: {
					ID: {
						type: type.ParameterType.STRING,
						default: "MyField",
					},
					STATE: {
						type: type.ParameterType.STRING,
						default:
							'@position "25%" "25%" @size "50%" "50%" @resize "none" @description "Enjoy typing..."',
					},
				},
				function: (args) => this.setFieldState(args),
			},
			{
				opcode: "qiming.multilines.get_field_state",
				type: type.BlockType.REPORTER,
				messageId: "qiming.multilines.get_field_state",
				categoryId: "qiming.multilines.category",
				param: {
					ID: {
						type: type.ParameterType.STRING,
						default: "MyField",
					},
					KEY: {
						type: type.ParameterType.STRING,
						default: "position.0",
					},
				},
				function: (args) => this.getFieldState(args),
			},
			{
				opcode: "qiming.multilines.set_field_value",
				type: type.BlockType.COMMAND,
				messageId: "qiming.multilines.set_field_value",
				categoryId: "qiming.multilines.category",
				param: {
					ID: {
						type: type.ParameterType.STRING,
						default: "MyField",
					},
					VALUE: {
						type: type.ParameterType.STRING,
						default: "Enjoy typing...",
					},
				},
				function: (args) => this.setFieldValue(args),
			},
			{
				opcode: "qiming.multilines.get_field_value",
				type: type.BlockType.REPORTER,
				messageId: "qiming.multilines.get_field_value",
				categoryId: "qiming.multilines.category",
				param: {
					ID: {
						type: type.ParameterType.STRING,
						default: "MyField",
					},
					FORMATTER: {
						type: type.ParameterType.STRING,
						default: "Null",
					},
				},
				function: (args) => this.getFieldValue(args),
			},
			{
				opcode: "qiming.multilines.remove_field",
				type: type.BlockType.COMMAND,
				messageId: "qiming.multilines.remove_field",
				categoryId: "qiming.multilines.category",
				param: {
					ID: {
						type: type.ParameterType.STRING,
						default: "MyField",
					},
				},
				function: (args) => this.removeField(args),
			},
			{
				opcode: "qiming.multilines.get_formatter",
				type: type.BlockType.REPORTER,
				messageId: "qiming.multilines.get_formatter",
				categoryId: "qiming.multilines.category",
				param: {
					FORMATTER: {
						type: type.ParameterType.STRING,
						default: "replace",
						menu: [
							{
								messageId: "qiming.multilines.formatter.null",
								value: "null",
							},
							{
								messageId: "qiming.multilines.formatter.replace",
								value: "replace",
							},
						],
					},
					ARGS: {
						type: type.ParameterType.STRING,
						default: '@from "\\n" @to "\\\\n"',
					},
				},
				function: (args) => this.getFormatter(args),
			},
			{
				opcode: "qiming.multilines.get_static_style",
				type: type.BlockType.REPORTER,
				messageId: "qiming.multilines.get_static_style",
				categoryId: "qiming.multilines.category",
				param: {
					TYPE: {
						type: type.ParameterType.STRING,
						default: "light_rounded",
						menu: [
							{
								messageId: "qiming.multilines.static_styles.light_rounded",
								value: "light_rounded",
							},
							{
								messageId: "qiming.multilines.static_styles.light",
								value: "light",
							},
							{
								messageId: "qiming.multilines.static_styles.dark_rounded",
								value: "dark_rounded",
							},
							{
								messageId: "qiming.multilines.static_styles.dark",
								value: "dark",
							},
						],
					},
				},
				function: (args) => this.getStaticStyle(args),
			},
		]);
	}
	onUninit() {
		api.removeCategory("qiming.multilines.category");
	}
}

module.exports = Multilines;

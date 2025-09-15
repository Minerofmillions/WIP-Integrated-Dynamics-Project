/**
 * TODO: Test that the operators involving regexes work correctly.
 * Test Map and pipe
 */
type TypeFunction = { kind: "Function"; from: TypeAny | TypeConcrete | TypeGeneric | TypeFunction | TypeList; to: TypeAny | TypeConcrete | TypeGeneric | TypeFunction | TypeList };
type TypeAny = { kind: "Any"; typeID: string; argName?: string };
type TypeConcrete = { name: "Integer" | "Long" | "Double" | "Boolean" | "String" | "Number"; kind: "Concrete" };
type TypeGeneric = { name: string; kind: "Generic"; of: TypeConcrete | TypeAny | TypeList; argName?: string };
type TypeOperator = { kind: "Operator"; args: TypeFunction[] };
type TypeList = { kind: "Concrete"; name: "List"; params: TypeAny[] | TypeConcrete[] | TypeGeneric[] | TypeFunction[] | TypeList[] }
type TypeTypeMap = { [typeID: string]: string }
type TypeLambda<P, R> = (...args: [P]) => R;

class IntegratedDynamicsClasses {
  static Item = class Item {
    itemName?: string;
    static defaultProps = {
      size: 1,
      maxSize: 64,
      stackable: true,
      damageable: false,
      damage: 0,
      maxDamage: 0,
      enchanted: false,
      enchantable: false,
      repairCost: 0,
      rarity: "",
      NBT: null,
      fluid: null,
      fluidCapacity: 0,
      uname: "",
      modName: "",
      fuelBurnTime: 0,
      fuel: false,
      tagNames: [],
      feContainer: false,
      feCapacity: 0,
      feStored: 0,
      inventory: null,
      tooltip: [],
      itemName: ""
    };
  
    constructor(newProps = {}, oldItem = {}) {
      Object.assign(this, Item.defaultProps, oldItem, newProps);
  
      for (const key of Object.keys(Item.defaultProps)) {
        const capKey = key.charAt(0).toUpperCase() + key.slice(1);
  
        if (!this.constructor.prototype[`get${capKey}`]) {
          this.constructor.prototype[`get${capKey}`] = function () {
            return this[key];
          };
        }
        if (!this.constructor.prototype[`set${capKey}`]) {
          this.constructor.prototype[`set${capKey}`] = function (value: any) {
            this[key] = value;
          };
        }
      }
    }

    getStrengthVsBlock(block: any) { // Any because typescript is a b***h and won't see the block type
      if (!(block instanceof IntegratedDynamicsClasses.Block)) throw new Error("block is not a Block");
      throw new Error("getStrengthVsBlock method not implemented");
    }

    canHarvestBlock(block: any) { // Any because typescript is a b***h and won't see the block type
      throw new Error("canHarvestBlock method not implemented");
    }

    equals(other: Item) {
      if (!(other instanceof Item)) return false;
      return JSON.stringify(this) === JSON.stringify(other);
    }

    toString() {
      return this.itemName;
    }
  }

  static Block = class Block {
    blockName?: string;
    static defaultProps = {
      NBT: null,
      fluid: null,
      fluidCapacity: 0,
      uname: "",
      modName: "",
      tagNames: [],
      feContainer: false,
      feCapacity: 0,
      feStored: 0,
      inventory: null,
      blockName: ""
    };
  
    constructor(newProps = {}, oldItem = {}) {
      Object.assign(this, Block.defaultProps, oldItem, newProps);
  
      for (const key of Object.keys(Block.defaultProps)) {
        const capKey = key.charAt(0).toUpperCase() + key.slice(1);
  
        if (!this.constructor.prototype[`get${capKey}`]) {
          this.constructor.prototype[`get${capKey}`] = function () {
            return this[key];
          };
        }
        if (!this.constructor.prototype[`set${capKey}`]) {
          this.constructor.prototype[`set${capKey}`] = function (value: any) {
            this[key] = value;
          };
        }
      }
    }

    getStrengthVsBlock(block: Block) {
      throw new Error("getStrengthVsBlock method not implemented");
    }

    canHarvestBlock(block: Block) {
      throw new Error("canHarvestBlock method not implemented");
    }

    equals(other: Block) {
      return JSON.stringify(this) === JSON.stringify(other);
    }

    toString() {
      return this.blockName;
    }
  }

  static Operator = class Operator extends Function {
    fn: (...args: any[]) => any;
    parsedSignature: InstanceType<typeof IntegratedDynamicsClasses.ParsedSignature>;
    typeMap: InstanceType<typeof IntegratedDynamicsClasses.TypeMap>;
    internalName: string;
    nicknames: string[];
    symbol: string;
    interactName: string;

    constructor({ internalName, nicknames, parsedSignature: rawSignature, symbol, interactName, function: fn }: { internalName: string; nicknames: string[]; parsedSignature: ParsedSignature; symbol: string; interactName: string; function: (...args: any[]) => any }) {
      super("...args", "return this.__call__(...args)");
      this.fn = fn;
      this.typeMap = new IntegratedDynamicsClasses.TypeMap(rawSignature);
      this.parsedSignature = new IntegratedDynamicsClasses.ParsedSignature(rawSignature);
      this.internalName = internalName;
      this.nicknames = nicknames;
      this.symbol = symbol;
      this.interactName = interactName;
    }


    __call__(...args: any[]) {
      if (args.length !== this.parsedSignature.args.length) {
        throw new Error(
          `Operator expected ${this.parsedSignature.args.length} args, got ${args.length}`
        );
      }
      return this.fn(...args);
    }

    apply(arg: any) {

      const parsedSignature = this.parsedSignature.apply(arg);
      const newFn = (...rest: any[]) => this.fn(arg, ...rest)
      return new Operator({
        internalName: this.internalName,
        nicknames: this.nicknames,
        parsedSignature: parsedSignature,
        symbol: this.symbol,
        interactName: this.interactName,
        function: newFn
      });
    }
  }

  static TypeMap = class TypeMap {

    aliases: Map<any, any>;
    constructor(ast?: TypeAny | TypeConcrete | TypeGeneric | TypeFunction) {
      this.aliases = new Map();

      if (ast) {
        this.extractTypeIDs(ast);
      }
    }

    private extractTypeIDs(node: any) {
      if (!node || typeof node !== "object") return;
  
      if (node.kind === "Generic" && node.typeID) {
        this.aliases.set(node.typeID, "Any");
      }
  
      // Recurse through all child properties
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
          value.forEach(v => this.extractTypeIDs(v));
        } else if (typeof value === "object" && value !== null) {
          this.extractTypeIDs(value);
        }
      }
    }
  
    find(typeID: string) {
      while (this.aliases.has(typeID)) {
        typeID = this.aliases.get(typeID);
      }
      return typeID;
    }
  
    unify<T extends TypeAny | TypeConcrete | TypeGeneric | TypeList | TypeFunction>(a: T, b: typeof a) {
      if (!a || !b) return;
  
      const repA = this._getID(a);
      const repB = this._getID(b);
  
      if (repA && repB) {
        this.aliases.set(this.find(repA), this.find(repB));
        return;
      }
  
      if (a.kind === "Concrete" && b.kind === "Concrete") {
        if (a.name !== b.name) {
          throw new Error(`Concrete type mismatch: ${a.name} vs ${b.name}`);
        }

        const pa = (a.name === "List" ? (a as TypeList).params : []) ?? [];
        const pb = (b.name === "List" ? (b as TypeList).params : []) ?? [];
      
        const n = Math.min(pa.length, pb.length);
        for (let i = 0; i < n; i++) this.unify(pa[i], pb[i]);
        return;
      }
    }
  
    _getID(node: TypeAny | TypeGeneric | TypeConcrete | TypeList | TypeFunction) {
      if (node.kind === "Any") return node.typeID;
      if (node.kind === "Generic") return node.name;
      return null;
    }
  
    rewrite(node: TypeAny | TypeConcrete | TypeFunction | TypeGeneric | TypeList): TypeAny | TypeConcrete | TypeFunction | TypeGeneric | TypeList {
      if (node.kind === "Any" && node.typeID) {
        return { ...node, typeID: this.find(node.typeID) };
      }
      if (node.kind === "Generic" && node.name) {
        return { ...node, name: this.find(node.name) };
      }
      if (node.kind === "Function") {
        return {
          kind: "Function",
          from: this.rewrite(node.from),
          to: this.rewrite(node.to)
        };
      }
      if (node.kind === "Concrete" && node.name === "List" && node.params) {
        return {
          kind: "Concrete",
          name: node.name,
          params: node.params.map(p => this.rewrite(p))
        } as TypeList;
      }
      return node;
    }

    resolve(node: TypeAny | TypeGeneric | TypeConcrete | TypeFunction | TypeList): typeof node {
      if (node.kind === "Any") {
        const alias = this.aliases.get(node.typeID);
        if (alias) {
          return this.resolve(alias as any);
        }
        return node;
      }

      if (node.kind === "Generic") {
        const resolvedTypeID = this.aliases.get(node.name);
        if (resolvedTypeID) {
          const resolved = this.aliases.get(resolvedTypeID);
          if (!resolved) throw new Error(`TypeMap inconsistency: alias ${resolvedTypeID} not found`);
          return this.resolve(resolved);
        }
        return node;
      }      

      if (node.kind === "Function") {
        return {
          kind: "Function",
          from: this.resolve(node.from),
          to: this.resolve(node.to)
        };
      }

      if (node.kind === "Concrete") {
        if (node.name === "List") {
          return {
            kind: "Concrete",
            name: "List",
            params: (node as TypeList).params.map((p) => this.resolve(p))
          } as TypeList;
        }
        return node as TypeConcrete;
      }

      throw new Error(`Unknown node kind in resolve: ${JSON.stringify(node)}`);
    }

  }

  static ParsedSignature = class ParsedSignature {
    ast: TypeOperator | TypeFunction;
    counter: number;
    typeMap: InstanceType<typeof IntegratedDynamicsClasses.TypeMap>;
    args: (string | TypeFunction | TypeConcrete | TypeGeneric | TypeAny | TypeList | TypeOperator)[];

    constructor(ast: TypeOperator | TypeList | TypeAny | TypeConcrete | TypeFunction | TypeGeneric, typeMap: InstanceType<typeof IntegratedDynamicsClasses.TypeMap> = new IntegratedDynamicsClasses.TypeMap()) {
      this.ast = this._normalize(ast) as TypeOperator | TypeFunction;
      this.counter = 1;
      this.typeMap = typeMap;
      this.args = this.toFlatSignature()
    };

    _normalize(node: TypeOperator | TypeConcrete | TypeGeneric | TypeAny | TypeFunction | TypeList, argIndex = 1): TypeConcrete | TypeGeneric | TypeAny | TypeFunction | TypeList | TypeOperator {
      if (!node) return node;
  
      switch(node.kind) {
         case "Any": {
          return {
            ...node,
            typeID: `$type${this.counter++}`,
            argName: node.argName || `arg${argIndex}`
          };
        }
    
        case "Generic": {
          return {
            ...node,
            name: `$${this.counter++}`,
            argName: node.argName || `arg${argIndex}`
          };
        }
    
        case "Function": {
          return Object.assign({}, node, {
            kind: "Function",
            from: this._normalize(node.from, argIndex),
            to: this._normalize(node.to, argIndex + 1)
          });
        }
    
        case "Concrete": {
          if (node.name === "List") {
            return Object.assign({}, node, {
              kind: "Concrete",
              name: node.name,
              params: node.params.map((p, i) => this._normalize(p, argIndex + i))
            });
          }
          return node;
        }
      }
      return node.args[0];
    }

    renameArgs(mapping: TypeTypeMap) {
      const rename = (node: TypeList | TypeAny | TypeFunction | TypeGeneric | TypeConcrete | TypeOperator): TypeList | TypeAny | TypeFunction | TypeGeneric | TypeConcrete => {
        if (!node) return node;

        if (node.kind === "Operator") return rename(node.args[0]);

        if (node.kind === "Concrete" && node.name === "List") {
          const listNode = node as TypeList;
          const params = listNode.params.map(rename) as (TypeAny | TypeConcrete | TypeGeneric | TypeFunction | TypeList)[];
          return Object.assign({}, listNode, params) as TypeList;
        }

        if (node.kind === "Any" || node.kind === "Generic") {
          const key = node.kind === "Any" ? node.typeID : node.name;
          if (key && mapping[key]) {
            return { ...node, argName: mapping[key] } as TypeAny | TypeGeneric;
          } else return node;
        }

        if (node.kind === "Function") {
          return { ...node, from: rename(node.from), to: rename(node.to) } as TypeFunction;
        }

        return node;
      };
      return new ParsedSignature(rename(this.ast), this.typeMap);
    }
  
    clone() {
      return new ParsedSignature(JSON.parse(JSON.stringify(this.ast)), this.typeMap);
    }
  
    getArity() {
      if (this.ast.kind === "Function") {
        let count = 0;
        let current = this.ast as TypeFunction | TypeGeneric | TypeConcrete | TypeAny | TypeList;
        while (current.kind === "Function") {
          count++;
          current = current.to;
        }
        return count;
      }
      if ("args" in this.ast) {
        return this.ast.args.length;
      }
      return 0;
    }
    getInput(index = 0) {
      if (!("args" in this.ast)) {
        throw new Error(`Invalid signature: ${JSON.stringify(this.ast, null, 2)}`);
      }
      if (!this.ast.args || index < 0 || index >= this.ast.args.length) {
        throw new Error(`Invalid input index ${index} for signature: ${JSON.stringify(this.ast, null, 2)}`);
      }
  
      const funcNode = this.ast.args[0];
      let current = funcNode;
  
      for (let i = 0; i < index; i++) {
        if (current.to && current.to.kind === "Function") {
          current = current.to;
        } else {
          throw new Error(`No input at index ${index} in signature: ${JSON.stringify(this.ast, null, 2)}`);
        }
      }
  
      return this.typeMap.resolve(current.from);
    }

    getOutput() {
      if (this.ast.kind === "Function") {
        return this.ast.to;
      }
      return this.ast;
    }
  
    pipe(other: ParsedSignature) {
      if (!this.args || other.args) {
        throw new Error("Can only pipe operators, not values");
      }
      const out = this.getOutput();
      const input = other.getInput();
    
      this.typeMap.unify(out, input);
    
      const newAST = Object.assign({}, this.ast, {
        kind: "Operator",
        args: [
          {
            kind: "Function",
            from: (this.ast.kind === "Function") ? this.ast.from : this.ast.args[0].from,
            to: other.getOutput()
          }
        ]
      });
    
      return new ParsedSignature(newAST, this.typeMap);
    }
    
    apply(argType: TypeFunction | TypeAny | TypeConcrete | TypeGeneric | TypeList) {
      if (this.ast.kind !== "Function") {
        throw new Error("Cannot apply non-function");
      }
    
      const expected = this.getInput(0);
      this.typeMap.unify(argType, expected);

      const newAst = this.typeMap.rewrite(this.ast.to);
      return new ParsedSignature(newAst, this.typeMap);
    }
  
    flip() {
      if (this.ast.kind !== "Function" || this.ast.to.kind !== "Function") {
        throw new Error("Flip needs 2 \"inputs\".");
      }
  
      const a = this.ast.from;
      const b = this.ast.to.from;
      const c = this.ast.to.to;
  
      const flipped = Object.assign({}, this.ast, {
        kind: "Function",
        from: b,
        to: {
          kind: "Function",
          from: a,
          to: c
        }
      });
  
      return new ParsedSignature(flipped, this.typeMap);
    }
  
    toFlatSignature() {
      const arr = [];
      let cur = this.ast as TypeFunction | TypeAny | TypeConcrete | TypeGeneric | TypeList;
      while (cur.kind === "Function") {
        arr.push(cur.from);
        cur = cur.to;
      }
      arr.push(cur);
      return arr;
    }
  }   


  globalMap = new IntegratedDynamicsClasses.TypeMap();

  operatorRegistry: { baseOperators: Record<string, InstanceType<typeof IntegratedDynamicsClasses.Operator>>; typeSerializers: Record<string, { valueType: string; nbtType: string }> } = {
    "baseOperators": {
      "and": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:logical_and",
        "nicknames": [
          "logicalAnd"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "&&",
        "interactName": "booleanAnd",
        "function": (bool1: boolean): TypeLambda<boolean, boolean> => {
          return (bool2: boolean): boolean => {
            return bool1 && bool2;
          }
        }
      }),
      "or": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:logical_or",
        "nicknames": [
          "logicalOr"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "||",
        "interactName": "booleanOr",
        "function": (bool1: boolean): TypeLambda<boolean, boolean> => {
          return (bool2: boolean): boolean => {
            return bool1 || bool2;
          }
        }
      }),
      "not": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:logical_not",
        "nicknames": [
          "logicalNot"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "!",
        "interactName": "booleanNot",
        "function": (bool: boolean): boolean => {
          return !bool;
        }
      }),
      "nand": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:logical_nand",
        "nicknames": [
          "logicalNand"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "!&&",
        "interactName": "booleanNand",
        "function": (func1: TypeLambda<boolean, boolean>): TypeLambda<TypeLambda<boolean, boolean>, TypeLambda<any, boolean>> => {
          return (func2: TypeLambda<boolean, boolean>): TypeLambda<any, boolean> => {
            return (input: any): boolean => {
              return !(func1(input) && func2(input));
            }
          }
        }
      }),
      "nor": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:logical_nor",
        "nicknames": [
          "logicalNor"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "!||",
        "interactName": "booleanNor",
        "function": (func1: TypeLambda<boolean, boolean>): TypeLambda<TypeLambda<boolean, boolean>, TypeLambda<any, boolean>> => {
          return (func2: TypeLambda<boolean, boolean>): TypeLambda<any, boolean> => {
            return (input: any): boolean => {
              return !(func1(input) || func2(input));
            }
          }
        }
      }),
      "add": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_addition",
        "nicknames": [
          "arithmeticAddition"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "+",
        "interactName": "numberAdd",
        "function": (num1: Number): TypeLambda<Number, Number> => {
          return (num2: Number): Number => {
            return num1.add(num2);
          }
        }
      }),
      "subtract": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_subtraction",
        "nicknames": [
          "arithmeticSubtraction"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "-",
        "interactName": "numberSubtract",
        "function": (num1) => {
          return (num2) => {
            return num1.subtract(num2);
          }
        }
      }),
      "multiply": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_multiplication",
        "nicknames": [
          "arithmeticMultiplication"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "*",
        "interactName": "numberMultiply",
        "function": (num1) => {
          return (num2) => {
            return num1.multiply(num2);
          }
        }
      }),
      "divide": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_division",
        "nicknames": [
          "arithmeticDivision"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "/",
        "interactName": "numberDivide",
        "function": (num1) => {
          return (num2) => {
            return num1.divide(num2);
          }
        }
      }),
      "max": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_maximum",
        "nicknames": [
          "arithmeticMaximum"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "max",
        "interactName": "numberMax",
        "function": (num1) => {
          return (num2) => {
            return IntegratedDynamicsClasses.Number.max(num1, num2);
          }
        }
      }),
      "min": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_minimum",
        "nicknames": [
          "arithmeticMinimum"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "min",
        "interactName": "numberMin",
        "function": (num1) => {
          return (num2) => {
            return IntegratedDynamicsClasses.Number.min(num1, num2);
          }
        }
      }),
      "increment": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_increment",
        "nicknames": [
          "arithmeticIncrement"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "++",
        "interactName": "numberIncrement",
        "function": (num1) => {
            return num1.add(1);
        }
      }),
      "decrement": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_decrement",
        "nicknames": [
          "arithmeticDecrement"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "--",
        "interactName": "numberDecrement",
        "function": (num1) => {
          return num1.subtract(1);
        }
      }),
      "modulus": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:arithmetic_modulus",
        "nicknames": [
          "arithmeticModulus"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "%",
        "interactName": "numberModulus",
        "function": (num1) => {
          return (num2) => {
            return num1.modulus(num2);
          }
        }
      }),
      "doubleSqrt": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:double_sqrt",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "sqrt",
        "interactName": "doubleSqrt",
        "function": (double) => {
          return double.sqrt();
        }
      }),
      "doublePow": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:double_pow",
        "nicknames": [
          "doublePow"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Double"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Double"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "pow",
        "interactName": "doublePow",
        "function": (base) => {
          return (exponent) => {
            return base.pow(exponent);
          }
        }
      }),
      "==": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:relational_equals",
        "nicknames": [
          "relationalEquals"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Any",
                  "typeID": "$type1"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Any",
                    "typeID": "$type1"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "==",
        "interactName": "anyEquals",
        "function": (value1) => {
          return (value2) => {
            try {return value1.equals(value2)} catch(e) {return value1 === value2};
          }
        }
      }),
      ">": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:relational_gt",
        "nicknames": [
          "relationalGt"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": ">",
        "interactName": "numberGreaterThan",
        "function": (num1) => {
          return (num2) => {
            return IntegratedDynamicsClasses.Number.gt(num1, num2);
          }
        }
      }),
      "<": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:relational_lt",
        "nicknames": [
          "relationalLt"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "<",
        "interactName": "numberLessThan",
        "function": (num1) => {
          return (num2) => {
            return IntegratedDynamicsClasses.Number.lt(num1, num2);
          }
        }
      }),
      "!=": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:relational_notequals",
        "nicknames": [
          "relationalNotequals"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Any",
                  "typeID": "$type1"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Any",
                    "typeID": "$type1"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "!=",
        "interactName": "anyNotEquals",
        "function": (value1) => {
          return (value2) => {
            try {return !value1.equals(value2)} catch(e) {return value1 !== value2};
          }
        }
      }),
      ">=": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:relational_ge",
        "nicknames": [
          "relationalGe"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": ">=",
        "interactName": "anyGreaterThanOrEquals",
        "function": (num1) => {
          return (num2) => {
            return IntegratedDynamicsClasses.Number.gt(num1, num2) || (() => {
              try {
                return num1.equals(num2);
              } catch (e) {
                return num1 === num2;
              }
            })();
          };
        }
      }),
      "<=": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:relational_le",
        "nicknames": [
          "relationalLe"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Number"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "<=",
        "interactName": "anyLessThanOrEquals",
        "function": (num1) => {
          return (num2) => {
            return IntegratedDynamicsClasses.Number.lt(num1, num2) || (() => {
              try {
                return num1.equals(num2);
              } catch (e) {
                return num1 === num2;
              }
            })();
          };
        }
      }),
      "binaryAnd": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:binary_and",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "&",
        "interactName": "integerBinaryAnd",
        "function": (int1) => {
          return (int2) => {
            return (int1 & int2);
          }
        }
      }),
      "binaryOr": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:binary_or",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "|",
        "interactName": "integerBinaryOr",
        "function": (int1) => {
          return (int2) => {
            return (int1 | int2);
          }
        }
      }),
      "binaryXor": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:binary_xor",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "^",
        "interactName": "integerXor",
        "function": (int1) => {
          return (int2) => {
            return (int1 ^ int2);
          }
        }
      }),
      "binaryComplement": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:binary_complement",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "~",
        "interactName": "integerComplement",
        "function": (int) => {
          return ~int;
        }
      }),
      "<<": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:binary_lshift",
        "nicknames": [
          "binaryLshift"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "<<",
        "interactName": "integerLeftShift",
        "function": (int1) => {
          return (int2) => {
            return (int1 << int2);
          }
        }
      }),
      ">>": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:binary_rshift",
        "nicknames": [
          "binaryRshift"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": ">>",
        "interactName": "integerRightShift",
        "function": (int1) => {
          return (int2) => {
            return (int1 >> int2);
          }
        }
      }),
      ">>>": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:binary_rzshift",
        "nicknames": [
          "binaryRzshift"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": ">>>",
        "interactName": "integerUnsignedRightShift",
        "function": (int1) => {
          return (int2) => {
            return (int1 >>> int2);
          }
        }
      }),
      "stringLength": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_length",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "len",
        "interactName": "stringLength",
        "function": (str) => {
          return str.length;
        }
      }),
      "stringConcat": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_concat",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "+",
        "interactName": "stringConcat",
        "function": (str1) => {
          return (str2) => {
            return str1.concat(str2);
          }
        }
      }),
      "stringContains": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_contains",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "contains",
        "interactName": "stringContains",
        "function": (substring) => {
          return (fullString) => {
            return fullString.includes(substring);
          }
        }
      }),
      "containsRegex": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_contains_regex",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "contains_regex",
        "interactName": "stringContainsRegex",
        "function": (regexString) => {
          return (fullString) => {
            const regex = new RE2(regexString, "u");
            return regex.test(fullString);
          }
        }
      }),
      "matchesRegex": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_matches_regex",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "matches_regex",
        "interactName": "stringMatchesRegex",
        "function": (regexString) => {
          return (fullString) => {
            if (regexString.startsWith('^')) regexString = regexString.slice(1);
            if (regexString.endsWith('$')) regexString = regexString.slice(0, -1);
            const regex = new RE2(`^(?:${regexString})$`, 'u');
            return regex.test(fullString);
          }
        }
      }),
      "stringIndexOf": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_index_of",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "index_of",
        "interactName": "stringIndexOf",
        "function": (substring) => {
          return (fullString) => {
            return fullString.indexOf(substring);
          }
        }
      }),
      "indexOfRegex": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_index_of_regex",
        "nicknames": [
          "stringIndexOfRegex"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "index_of_regex",
        "interactName": "stringIndexOfRegex",
        "function": (regexString) => {
          return (fullString) => {
            const regex = new RE2(regexString, "u");
            const match = fullString.search(regex);
          }
        }
      }),
      "startsWith": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_starts_with",
        "nicknames": [
          "stringStartsWith"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "starts_with",
        "interactName": "stringStartsWith",
        "function": (substring) => {
          return (fullString) => {
            return fullString.startsWith(substring);
          }
        }
      }),
      "endsWith": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_ends_with",
        "nicknames": [
          "stringEndsWith"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "ends_with",
        "interactName": "stringEndsWith",
        "function": (substring) => {
          return (fullString) => {
            return fullString.endsWith(substring);
          }
        }
      }),
      "stringSplitOn": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_split_on",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "String"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "split_on",
        "interactName": "stringSplitOn",
        "function": (delimiter) => {
          return (fullString) => {
            return fullString.split(delimiter);
          }
        }
      }),
      "stringSplitOnRegex": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_split_on_regex",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "String"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "split_on_regex",
        "interactName": "stringSplitOnRegex",
        "function": (regexString) => {
          return (fullString) => {
            const regex = new RE2(regexString, "u");
            return fullString.split(regex);
          }
        }
      }),
      "substring": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_substring",
        "nicknames": [
          "stringSubstring"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "substring",
        "interactName": "integerSubstring",
        "function": (start) => {
          return (end) => {
            return (fullString) => {
              return fullString.substring(start, end);
            }
          }
        }
      }),
      "stringRegexGroup": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_regex_group",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "regex_group",
        "interactName": "stringRegexGroup",
        "function": (regexString) => {
          return (groupIndex) => {
            return (fullString) => {
              const regex = new RE2(regexString, "u");
              const match = regex.exec(fullString);
              if (match && match[groupIndex] !== undefined) {
                return match[groupIndex];
              } else {
                throw new Error(`No match found for group index ${groupIndex} in regex "${regexString}" on string "${fullString}"`);
              }
            }
          }
        }
      }),
      "stringRegexGroups": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_regex_groups",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "String"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "regex_groups",
        "interactName": "stringRegexGroups",
        "function": (regexString) => {
          return (fullString) => {
            const regex = new RE2(regexString, "u");
            const match = regex.exec(fullString);
            if (match) {
              return match;
            } else {
              throw new Error(`No match found for group index ${groupIndex} in regex "${regexString}" on string "${fullString}"`);
            }
          }
        }
      }),
      "stringRegexScan": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_regex_scan",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Concrete",
                          "name": "String"
                        }
                      ]
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "regex_scan",
        "interactName": "stringRegexScan",
        "function": (regexString) => {
          return (groupIndex) => {
            return (fullString) => {
              const regex = new RE2(regexString, "gu");
              let results = [];
              let match;
              regex.lastIndex = 0;

              while ((match = regex.exec(fullString)) !== null) {
                const groupValue = match[groupIndex];
                if (groupValue !== undefined && groupValue !== null) {
                  results.push(groupValue);
                }
              }

              return results;
            }
          }
        }
      }),
      "stringReplace": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_replace",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "replace",
        "interactName": "stringReplace",
        "function": (searchString) => {
          return (replacementString) => {
            return (fullString) => {
              return fullString.replace(searchString, replacementString);
            }
          }
        }
      }),
      "stringReplaceRegex": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_replace_regex",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "replace_regex",
        "interactName": "stringReplaceRegex",
        "function": (regexString) => {
          return (replacementString) => {
            return (fullString) => {
              const regex = new RE2(regexString, "u");
              return fullString.replace(regex, replacementString);
            }
          }
        }
      }),
      "stringJoin": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_join",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "String"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "join",
        "interactName": "stringJoin",
        "function": (delimiter) => {
          return (stringList) => {
            if (stringList.some(item => typeof item !== 'string')) {
              throw new Error("stringJoin expects a list of strings");
            }
            return stringList.join(delimiter);
          }
        }
      }),
      "name": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_name",
        "nicknames": [
          "namedName",
          "toString"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Named"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "name",
        "interactName": "namedName",
        "function": (named) => {
          return named.toString();
        }
      }),
      "uname": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_unique_name",
        "nicknames": [
          "uniquelynamedUniquename"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "UniquelyNamed"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "uname",
        "interactName": "uniquely_namedUniqueName",
        "function": (uniquelyNamed) => {
          return uniquelyNamed.getUniqueName();
        }
      }),
      "error": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_string_error",
        "nicknames": [
          "string_error"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Any",
                  "typeID": "$type1"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "error",
        "interactName": "stringStringError",
        "function": (message) => {
          throw new Error(`Error: ${message}`);
        }
      }),
      "round": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:number_round",
        "nicknames": [
          "numberRound"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "|| ||",
        "interactName": "numberRound",
        "function": (number) => {
          return number.round();
        }
      }),
      "ceil": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:number_ceil",
        "nicknames": [
          "numberCeil"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "⌈ ⌉",
        "interactName": "numberCeil",
        "function": (number) => {
          return number.ceil();
        }
      }),
      "floor": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:number_floor",
        "nicknames": [
          "numberFloor"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "⌊ ⌋",
        "interactName": "numberFloor",
        "function": (number) => {
          return number.floor();
        }
      }),
      "compact": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:number_compact",
        "nicknames": [
          "numberCompact"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Number"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "compact",
        "interactName": "numberCompact",
        "function": (number) => {
          return number.compact();
        }
      }),
      "isNull": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:general_isnull",
        "nicknames": [
          "nullableIsnull"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Any",
                  "typeID": "$type1"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "o",
        "interactName": "anyIsNull",
        "function": (value) => {
          return value === null || value === undefined;
        }
      }),
      "isNotNull": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:general_isnotnull",
        "nicknames": [
          "nullableIsnotnull"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Any",
                  "typeID": "$type1"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "∅",
        "interactName": "anyIsNotNull",
        "function": (value) => {
          return value !== null && value !== undefined;
        }
      }),
      "listLength": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_length",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "| |",
        "interactName": "listLength",
        "function": (list) => {
          return list.length;
        }
      }),
      "listEmpty": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_empty",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "∅",
        "interactName": "listIsEmpty",
        "function": (list) => {
          return list.length === 0;
        }
      }),
      "listNotEmpty": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_notempty",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "o",
        "interactName": "listIsNotEmpty",
        "function": (list) => {
          return list.length > 0;
        }
      }),
      "get": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_get",
        "nicknames": [
          "listElement"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Any",
                    "typeID": "$type1"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "get",
        "interactName": "listGet",
        "function": (index) => {
          return (list) => {
            if (index < 0 || index >= list.length) {
              throw new Error(`Index ${index} out of bounds for list of length ${list.length}`);
            }
            return list[index];
          }
        }
      }),
      "getOrDefault": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_get_or_default",
        "nicknames": [
          "listElementDefault",
          "get_or_default"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "get_or_default",
        "interactName": "listGetOrDefault",
        "function": (index, defaultValue) => {
          return (list) => {
            if (index < 0 || index >= list.length) {
              return defaultValue;
            }
            return list[index];
          }
        }
      }),
      "listContains": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_contains",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Any",
                    "typeID": "$type1"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "contains",
        "interactName": "listContains",
        "function": (element) => {
          return (list) => {
            return list.includes(element);
          }
        }
      }),
      "listContainsPredicate": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_contains_p",
        "nicknames": ["listContainsP"],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Operator",
                    "args": [
                      {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$3",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type1"
                          }
                        },
                        "to": {
                          "kind": "Generic",
                          "name": "$4",
                          "of": {
                            "kind": "Concrete",
                            "name": "Boolean"
                          }
                        }
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$5",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "contains_p",
        "interactName": "listContainsPredicate",
        "function": (predicate) => {
          return (list) => {
            return list.some(item => predicate(item));
          }
        }
      }),
      "listCount": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_count",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "name": "$2",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Any",
                    "typeID": "$type1"
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "count",
        "interactName": "listCount",
        "function": (list) => {
          return (element) => {
            return list.filter(item => item === element).length;
          }
        }
      }),
      "listCountPredicate": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_count_p",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Operator",
                    "args": [
                      {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$3",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type1"
                          }
                        },
                        "to": {
                          "kind": "Generic",
                          "name": "$4",
                          "of": {
                            "kind": "Concrete",
                            "name": "Boolean"
                          }
                        }
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$5",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "count_p",
        "interactName": "listCountPredicate",
        "function": (list) => {
          return (predicate) => {
            return list.filter(item => predicate(item)).length;
          }
        }
      }),
      "append": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_append",
        "nicknames": [
          "listAppend"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Any",
                    "typeID": "$type1"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "append",
        "interactName": "listAppend",
        "function": (list) => {
          return (element) => {
            return [...list, element];
          }
        }
      }),
      "listConcat": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_concat",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "concat",
        "interactName": "listConcat",
        "function": (list1) => {
          return (list2) => {
            return [...list1, ...list2];
          }
        }
      }),
      "lazybuilt": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_lazybuilt",
        "nicknames": [
          "listLazybuilt"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any",
                  "typeID": "$type1"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Operator",
                    "args": [
                      {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$3",
                          "of": {
                            "kind": "Concrete",
                            "name": "Any",
                            "typeID": "$type1"
                          }
                        },
                        "to": {
                          "kind": "Function",
                          "from": {
                            "kind": "Generic",
                            "name": "$4",
                            "of": {
                              "kind": "Concrete",
                              "name": "Any",
                              "typeID": "$type1"
                            }
                          },
                          "to": {
                            "kind": "Generic",
                            "name": "$5",
                            "of": {
                              "kind": "Concrete",
                              "name": "List",
                              "params": [
                                {
                                  "kind": "Concrete",
                                  "name": "Any",
                                  "typeID": "$type1"
                                }
                              ]
                            }
                          }
                        }
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$6",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "lazybuilt",
        "interactName": "anyLazyBuilt",
        "function": (element) => {
          return (builder) => {
            return new InfiniteList(builder);
          }
        }
      }),
      "head": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_head",
        "nicknames": [
          "listHead"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Any",
                  "typeID": "$type1"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "head",
        "interactName": "listHead",
        "function": (list) => {
          if (list.length === 0) {
            throw new Error("head called on an empty list");
          }
          return list[0];
        }
      }),
      "tail": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_tail",
        "nicknames": [
          "listTail"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "tail",
        "interactName": "listTail",
        "function": (list) => {
          if (list.length === 0) {
            throw new Error("tail called on an empty list");
          }
          return list.slice(1);
        }
      }),
      "listUniqPredicate": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_uniq_p",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Operator",
                    "args": [
                      {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$3",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type1"
                          }
                        },
                        "to": {
                          "kind": "Function",
                          "name": "$4",
                          "from": {
                            "kind": "Generic",
                            "name": "$5",
                            "of": {
                              "kind": "Concrete",
                              "name": "Any",
                              "typeID": "$type1"
                            },
                            "to": {
                              "kind": "Generic",
                              "name": "$6",
                              "of": {
                                "kind": "Concrete",
                                "name": "Boolean"
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$7",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "uniq_p",
        "interactName": "listUniquePredicate",
        "function": (list) => {
          return (predicate) => {
            const seen = new Set();
            return list.filter(item => {
              const key = predicate(item);
              if (seen.has(key)) {
                return false;
              } else {
                seen.add(key);
                return true;
              }
            });
          }
        }
      }),
      "listUniq": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_uniq",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "uniq",
        "interactName": "listUnique",
        "function": (list) => {
          const seen = new Set();
          return list.filter(item => {
            if (seen.has(item)) {
              return false;
            } else {
              seen.add(item);
              return true;
            }
          });
        }
      }),
      "slice": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_slice",
        "nicknames": [
          "listSlice"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      ]
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "slice",
        "interactName": "listSlice",
        "function": (list) => {
          return (start) => {
            return (end) => {
              if (start < 0 || end > list.length || start > end) {
                throw new Error(`Invalid slice range: [${start}, ${end}) for list of length ${list.length}`);
              }
              return list.slice(start, end);
            }
          }
        }
      }),
      "intersection": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_intersection",
        "nicknames": [
          "listIntersection"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "∩",
        "interactName": "listIntersection",
        "function": (list1) => {
          return (list2) => {
            const set1 = new Set(list1);
            return list2.filter(item => set1.has(item));
          }
        }
      }),
      "equalsSet": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_equals_set",
        "nicknames": [
          "listEqualsSet"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "=set=",
        "interactName": "listEquals_set",
        "function": (list1) => {
          return (list2) => {
            const set1 = new Set(list1);
            const set2 = new Set(list2);
            return set1.equals(set2);
          }
        }
      }),
      "equalsMultiset": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:list_equals_multiset",
        "nicknames": [
          "listEqualsMultiset"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "=multiset=",
        "interactName": "listEquals_multiset",
        "function": (list1) => {
          return (list2) => {
            const newList1 = [...list1].sort();
            const newList2 = [...list2].sort();
            if (newList1.length !== newList2.length) {
              return false;
            }
            for (let i = 0; i < newList1.length; i++) {
              if (Object.keys(newList1[i]).includes("equals") && typeof newList1[i].equals === "function") {
                if (!newList1[i].equals(newList2[i])) {
                  return false;
                }
              } else if (newList1[i] !== newList2[i]) {
                return false;
              }
            }
            return true;
          }
        }
      }),
      "opaque": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_opaque",
        "nicknames": [
          "BlockOpaque"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "opaque",
        "interactName": "blockIsOpaque",
        "function": (block) => {
          return block.isOpaque();
        }
      }),
      "blockItem": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_itemstack",
        "nicknames": [
          "BlockItemstack",
          "block_item",
          "blockItemstack",
          "block_itemstack"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "itemstack",
        "interactName": "blockItemStack",
        "function": (block) => {
          return block.getItem();
        }
      }),
      "blockMod": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_mod",
        "nicknames": [
          "BlockModname",
          "block_mod",
          "blockMod",
          "block_modname"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "mod",
        "interactName": "blockMod",
        "function": (block) => {
          return block.getModName();
        }
      }),
      "breakSound": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_breaksound",
        "nicknames": [
          "BlockBreaksound",
          "block_break_sound",
          "blockBreakSound"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "break_sound",
        "interactName": "blockBreakSound",
        "function": (block) => {
          return block.getBreakSound();
        }
      }),
      "placeSound": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_placesound",
        "nicknames": [
          "BlockPlacesound",
          "blockPlaceSound",
          "block_place_sound"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "place_sound",
        "interactName": "blockPlaceSound",
        "function": (block) => {
          return block.getPlaceSound();
        }
      }),
      "stepSound": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_stepsound",
        "nicknames": [
          "BlockStepsound",
          "blockStepSound",
          "block_step_sound"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "step_sound",
        "interactName": "blockStepSound",
        "function": (block) => {
          return block.getStepSound();
        }
      }),
      "blockIsShearable": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_isshearable",
        "nicknames": [
          "BlockIsshearable",
          "block_is_shearable",
          "blockIsShearable"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_shearable",
        "interactName": "blockIsShearable",
        "function": (block) => {
          return block.isShearable();
        }
      }),
      "plantAge": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_plantage",
        "nicknames": [
          "BlockPlantage",
          "block_plant_age",
          "blockPlantAge"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "plant_age",
        "interactName": "blockPlantAge",
        "function": (block) => {
          return block.getPlantAge();
        }
      }),
      "blockByName": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_blockbyname",
        "nicknames": [
          "BlockByName",
          "block_by_name"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "block_by_name",
        "interactName": "stringBlockByName",
        "function": (name) => {
          throw new Error("Block by name is infeasible without a registry. This is a placeholder function.");
        }
      }),
      "blockProperties": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_blockproperties",
        "nicknames": [
          "BlockProperties",
          "block_properties"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "block_props",
        "interactName": "blockProperties",
        "function": (block) => {
          return block.getProperties();
        }
      }),
      "blockWithProperties": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_blockfromproperties",
        "nicknames": [
          "BlockWithProperties",
          "block_with_properties"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Block"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "block_with_props",
        "interactName": "blockWithProperties",
        "function": (block) => {
          return (properties) => {
            return new Block({properties}, block);
          }
        }
      }),
      "blockPossibleProperties": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_blockpossibleproperties",
        "nicknames": [
          "BlockPossibleProperties",
          "block_possible_properties"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "block_all_props",
        "interactName": "blockPossibleProperties",
        "function": (block) => {
          throw new Error("Block possible properties is infeasible without a registry. This is a placeholder function.");
        }
      }),
      "blockTag": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:block_tag",
        "nicknames": [
          "BlockTag"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "block_tag_names",
        "interactName": "blockTags",
        "function": (block) => {
          return block.getTagNames();
        }
      }),
      "blockTagStacks": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_blocktag",
        "nicknames": [
          "BlockTagStacks",
          "block_tag_stacks"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Block"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "block_tag_values",
        "interactName": "stringBlocksByTag",
        "function": (tag) => {
          throw new Error("Block tag values is infeasible without a registry. This is a placeholder function.");
        }
      }),
      "size": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_size",
        "nicknames": [
          "ItemstackSize",
          "itemstack_size",
          "itemstackSize"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "size",
        "interactName": "itemstackSize",
        "function": (item) => {
          return item.getSize();
        }
      }),
      "maxSize": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_maxsize",
        "nicknames": [
          "ItemstackMaxsize",
          "itemstack_max_size",
          "itemstackMaxSize"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "maxsize",
        "interactName": "itemstackMaxSize",
        "function": (item) => {
          return item.getMaxSize();
        }
      }),
      "isStackable": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_stackable",
        "nicknames": [
          "ItemstackIsstackable",
          "itemstack_is_stackable",
          "itemstackIsStackable"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "stackable",
        "interactName": "itemstackIsStackable",
        "function": (item) => {
          return item.getStackable();
        }
      }),
      "isDamageable": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_damageable",
        "nicknames": [
          "ItemstackIsdamageable",
          "itemstack_is_damageable",
          "itemstackIsDamageable"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "damageable",
        "interactName": "itemstackIsDamageable",
        "function": (item) => {
          return item.getDamageable();
        }
      }),
      "damage": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_damage",
        "nicknames": [
          "ItemstackDamage",
          "itemstack_damage",
          "itemstackDamage"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "damage",
        "interactName": "itemstackDamage",
        "function": (item) => {
          return item.getDamage();
        }
      }),
      "maxDamage": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_maxdamage",
        "nicknames": [
          "ItemstackMaxdamage",
          "itemstack_max_damage",
          "itemstackMaxDamage"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "max_damage",
        "interactName": "itemstackMaxDamage",
        "function": (item) => {
          return item.getMaxDamage();
        }
      }),
      "enchanted": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_enchanted",
        "nicknames": [
          "ItemstackIsenchanted",
          "itemstack_is_enchanted",
          "itemstackIsEnchanted",
          "isEnchanted"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "enchanted",
        "interactName": "itemstackIsEnchanted",
        "function": (item) => {
          return item.getEnchanted();
        }
      }),
      "enchantable": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_enchantable",
        "nicknames": [
          "ItemstackIsenchantable",
          "itemstack_is_enchantable",
          "itemstackIsEnchantable",
          "isEnchantable"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "enchantable",
        "interactName": "itemstackIsEnchantable",
        "function": (item) => {
          return item.getEnchantable();
        }
      }),
      "repairCost": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_repaircost",
        "nicknames": [
          "ItemstackRepaircost",
          "itemstack_repair_cost",
          "itemstackRepairCost"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "repair_cost",
        "interactName": "itemstackRepairCost",
        "function": (item) => {
          return item.getRepairCost();
        }
      }),
      "rarity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_rarity",
        "nicknames": [
          "ItemstackRarity",
          "itemstack_rarity",
          "itemstackRarity"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "rarity",
        "interactName": "itemstackRarity",
        "function": (item) => {
          return item.getRarity();
        }
      }),
      "strengthVsBlock": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_strength",
        "nicknames": [
          "ItemstackStrengthVsBlock",
          "itemstack_strength_vs_block",
          "itemstackStrengthVsBlock"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Block"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Double"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "strength",
        "interactName": "itemstackStrength",
        "function": (item) => {
          return (block) => {
            return item.getStrengthVsBlock(block);
          }
        }
      }),
      "canHarvestBlock": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_canharvest",
        "nicknames": [
          "ItemstackCanHarvestBlock",
          "itemstack_can_harvest_block",
          "itemstackCanHarvestBlock"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Block"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "can_harvest",
        "interactName": "itemstackCanHarvest",
        "function": (item) => {
          return (block) => {
            return item.canHarvestBlock(block);
          }
        }
      }),
      "itemBlock": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_block",
        "nicknames": [
          "ItemstackBlock",
          "itemstack_block",
          "itemstackBlock"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "block",
        "interactName": "itemstackBlock",
        "function": (item) => {
          return new Block({}, item);
        }
      }),
      "isFluidstack": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_isfluidstack",
        "nicknames": [
          "ItemstackIsfluidstack",
          "itemstack_is_fluidstack",
          "itemstackIsFluidstack",
          "itemHasFluid"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_fluidstack",
        "interactName": "itemstackIsFluidStack",
        "function": (item) => {
          return item.getFluid() !== null;
        }
      }),
      "itemFluid": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_fluidstack",
        "nicknames": [
          "ItemstackFluidstack",
          "itemstack_fluidstack",
          "itemstackFluidstack",
          "itemFluidstack",
          "item_fluidstack",
          "itemFluid",
          "item_fluid",
          "itemstack_fluid",
          "itemstackFluid"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "fluidstack",
        "interactName": "itemstackFluidStack",
        "function": (item) => {
          return item.getFluid();
        }
      }),
      "fluidCapacity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_fluidstackcapacity",
        "nicknames": [
          "ItemstackFluidstackcapacity",
          "itemstack_fluidstack_capacity",
          "itemstackFluidstackCapacity",
          "item_fluid_capacity",
          "itemFluidCapacity",
          "item_fluidstack_capacity",
          "itemFluidstackCapacity"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "fluidstack_capacity",
        "interactName": "itemstackFluidCapacity",
        "function": (item) => {
          return item.getFluidCapacity();
        }
      }),
      "=NBT=": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_isnbtequal",
        "nicknames": [
          "ItemstackIsdataequal",
          "itemstack_is_dataequal",
          "itemstackIsDataequal"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Item"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "=NBT=",
        "interactName": "itemstackIsNbtEqual",
        "function": (item1) => {
          return (item2) => {
            return (JSON.stringify(item1.getNBT()) === JSON.stringify(item2.getNBT()));
          }
        }
      }),
      "=NoNBT=": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_isitemequalnonbt",
        "nicknames": [
          "ItemstackIsitemequalnodata",
          "itemstack_is_itemequalnodata",
          "itemstackIsItemequalnodata"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Item"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "=NoNBT=",
        "interactName": "itemstackIsEqualNonNbt",
        "function": (item1) => {
          return (item2) => {
            return (item1.getUname() === item2.getUname() && item1.getSize() === item2.getSize());
          }
        }
      }),
      "rawItemEquals": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_israwitemequal",
        "nicknames": [
          "ItemstackIsrawitemequal",
          "itemstack_is_rawitemequal",
          "itemstackIsRawitemequal"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Item"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "=Raw=",
        "interactName": "itemstackIsEqualRaw",
        "function": (item1) => {
          return (item2) => {
            return (item1.getUname() === item2.getUname());
          }
        }
      }),
      "itemMod": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_mod",
        "nicknames": [
          "ItemstackModname",
          "item_mod",
          "itemModname"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "mod",
        "interactName": "itemstackMod",
        "function": (item) => {
          return item.getModName();
        }
      }),
      "fuelBurnTime": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_burntime",
        "nicknames": [
          "ItemstackFuelburntime",
          "item_fuel_burn_time",
          "itemFuelBurnTime"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "burn_time",
        "interactName": "itemstackBurnTime",
        "function": (item) => {
          return item.getFuelBurnTime();
        }
      }),
      "isFuel": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_canburn",
        "nicknames": [
          "ItemstackCanburn",
          "item_can_burn",
          "itemCanBurn",
          "item_is_fuel",
          "itemIsFuel"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "can_burn",
        "interactName": "itemstackCanBurn",
        "function": (item) => {
          return item.getFuel();
        }
      }),
      "itemTagNames": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_tag",
        "nicknames": [
          "ItemstackTag",
          "itemstack_tag_names",
          "itemstackTagNames",
          "item_tag_names"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "String"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "item_tag_names",
        "interactName": "itemstackTags",
        "function": (item) => {
          return item.getTagNames();
        }
      }),
      "itemTagValues": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_tag",
        "nicknames": [
          "ItemstackTagStacks",
          "itemstack_tag_values",
          "itemstackTagValues",
          "item_tag_values"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "Item"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "item_tag_values",
        "interactName": "stringItemsByTag",
        "function": (tag) => {
          throw new Error("Item tag values is infeasible without a registry. This is a placeholder function.");
        }
      }),
      "itemWithSize": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_withsize",
        "nicknames": [
          "ItemstackWithsize",
          "itemstack_with_size",
          "itemstackWithSize",
          "item_with_size"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$2",
                    "of": {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Item"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "with_size",
        "interactName": "itemstackWithSize",
        "function": (item) => {
          return (size) => {
            return new IntegratedDynamicsClasses.Item({size}, item);
          }
        }
      }),
      "isFeContainer": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_isfecontainer",
        "nicknames": [
          "ItemstackIsfecontainer",
          "itemstack_is_fe_container",
          "itemstackIsFecontainer",
          "item_is_fe_container",
          "itemIsFecontainer"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_fe_container",
        "interactName": "itemstackIsFeContainer",
        "function": (item) => {
          return item.getFeContainer();
        }
      }),
      "storedFe": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_storedfe",
        "nicknames": [
          "ItemstackStoredfe",
          "itemstack_stored_fe",
          "itemstackStoredFe",
          "item_stored_fe",
          "itemStoredFe"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "stored_fe",
        "interactName": "itemstackFeStored",
        "function": (item) => {
          return item.getFeStored();
        }
      }),
      "feCapacity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_fecapacity",
        "nicknames": [
          "ItemstackFecapacity",
          "itemstack_fe_capacity",
          "itemstackFeCapacity",
          "item_fe_capacity",
          "itemFeCapacity"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "capacity_fe",
        "interactName": "itemstackFeCapacity",
        "function": (item) => {
          return item.getFeCapacity();
        }
      }),
      "hasInventory": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_hasinventory",
        "nicknames": [
          "ItemstackHasinventory",
          "itemstack_has_inventory",
          "itemstackHasInventory",
          "item_has_inventory",
          "itemHasInventory"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "has_inventory",
        "interactName": "itemstackHasInventory",
        "function": (item) => {
          return item.getInventory() !== null;
        }
      }),
      "inventorySize": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_inventorysize",
        "nicknames": [
          "ItemstackInventorysize",
          "itemstack_inventory_size",
          "itemstackInventorySize",
          "item_inventory_size",
          "itemInventorySize"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "inventory_size",
        "interactName": "itemstackInventorySize",
        "function": (item) => {
          return item.getInventory().length || 0;
        }
      }),
      "itemInventory": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_inventory",
        "nicknames": [
          "ItemstackInventory",
          "itemstack_inventory",
          "itemstackInventory",
          "item_inventory"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "Item"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "inventory",
        "interactName": "itemstackInventory",
        "function": (item) => {
          return item.getInventory();
        }
      }),
      "itemByName": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_itembyname",
        "nicknames": [
          "ItemstackByName",
          "itemstack_by_name",
          "itemstackByName",
          "item_by_name"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Item"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "item_by_name",
        "interactName": "stringItemByName",
        "function": (name) => {
          throw new Error("Item by name is infeasible without a registry. This is a placeholder function.");
        }
      }),
      "itemListCount": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_itemlistcount",
        "nicknames": [
          "ItemstackListCount",
          "itemstack_list_count",
          "itemstackListCount",
          "item_list_count"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List"
                },
                "params": [
                  {
                    "kind": "Concrete",
                    "name": "Item"
                  }
                ],
                "to": {
                  "kind": "Function",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Item"
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "item_list_count",
        "interactName": "listItemListCount",
        "function": (items) => {
          return (item) => {
            return items.filter(i => {
              try {
                return i.equals(item)
              } catch(e) {
                return false;
              }}
            ).length;
          }
        }
      }),
      "itemNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_nbt",
        "nicknames": [
          "ItemstackData",
          "itemstack_data",
          "itemstackData",
          "item_data",
          "itemData"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT()",
        "interactName": "itemstackNbt",
        "function": (item) => {
          return item.getNBT();
        }
      }),
      "hasNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_hasnbt",
        "nicknames": [
          "ItemstackHasdata",
          "itemstack_has_data",
          "itemstackHasData",
          "item_has_data",
          "itemHasData"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "has_nbt",
        "interactName": "itemstackHasNbt",
        "function": (item) => {
          return item.getNBT() !== null && item.getNBT() !== undefined;
        }
      }),
      "itemNBTKeys": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_datakeys",
        "nicknames": [
          "ItemstackDataKeys",
          "itemstack_data_keys",
          "itemstackDataKeys",
          "item_data_keys",
          "itemDataKeys"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "String"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "data_keys",
        "interactName": "itemstackDataKeys",
        "function": (item) => {
          const nbt = item.getNBT();
          if (!nbt) {
            return [];
          }
          return Object.keys(nbt).filter(key => nbt[key] !== undefined && nbt[key] !== null);
        }
      }),
      "itemNBTValue": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_datavalue",
        "nicknames": [
          "ItemstackDataValue",
          "itemstack_data_value",
          "itemstackDataValue",
          "item_data_value",
          "itemDataValue"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$2",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "data_value",
        "interactName": "itemstackDataValue",
        "function": (item) => {
          return (key) => {
            const nbt = item.getNBT();
            if (!nbt || !nbt.hasOwnProperty(key)) {
              return null;
            }
            return nbt[key];
          }
        }
      }),
      "itemWithNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_withdata",
        "nicknames": [
          "ItemstackWithData",
          "itemstack_with_data",
          "itemstackWithData",
          "item_with_data",
          "itemWithData"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "with_data",
        "interactName": "itemstackWithData",
        "function": (item) => {
          return (key) => {
            return (value) => {
              const nbt = item.getNBT() || {};
              nbt[key] = value;
              return new item({nbt}, item);
            }
          }
        }
      }),
      "itemTooltip": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_tooltip",
        "nicknames": [
          "ItemstackTooltip",
          "itemstack_tooltip",
          "itemstackTooltip",
          "item_tooltip"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "String"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "tooltip",
        "interactName": "itemstackTooltip",
        "function": (item) => {
          return item.getTooltip();
        }
      }),
      "itemEntityTooltip": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_entityitemtooltip",
        "nicknames": [
          "ItemstackEntityTooltip",
          "itemstack_entity_tooltip",
          "itemstackEntityTooltip",
          "item_entity_tooltip"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Item"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "String"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "entity_item_tooltip",
        "interactName": "entityEntityItemTooltip",
        "function": (entity) => {
          return (item) => {
            console.warn("Entity item tooltip is not fully supported. Returning item tooltip only.");
            return item.getTooltip();
          }
        }
      }),
      "isMob": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_ismob",
        "nicknames": [
          "EntityIsmob",
          "entity_is_mob",
          "entityIsMob"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_mob",
        "interactName": "entityIsMob",
        "function": (entity) => {
          return entity.getMob();
        }
      }),
      "isAnimal": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_isanimal",
        "nicknames": [
          "EntityIsanimal",
          "entity_is_animal",
          "entityIsAnimal"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_animal",
        "interactName": "entityIsAnimal",
        "function": (entity) => {
          return entity.isAnimal();
        }
      }),
      "isItem": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_isitem",
        "nicknames": [
          "EntityIsitem",
          "entity_is_item",
          "entityIsItem"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_item",
        "interactName": "entityIsItem",
        "function": (entity) => {
          return entity.isItem();
        }
      }),
      "isPlayer": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_isplayer",
        "nicknames": [
          "EntityIsplayer",
          "entity_is_player",
          "entityIsPlayer"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_player",
        "interactName": "entityIsPlayer",
        "function": (entity) => {
          return entity.isPlayer();
        }
      }),
      "isMinecart": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_isminecart",
        "nicknames": [
          "EntityIsminecart",
          "entity_is_minecart",
          "entityIsMinecart"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_minecart",
        "interactName": "entityIsMinecart",
        "function": (entity) => {
          return entity.isMinecart();
        }
      }),
      "entityItem": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_item",
        "nicknames": [
          "EntityItemstack",
          "entity_itemstack",
          "entityItemstack",
          "entity_item_stack",
          "entityItemStack",
          "entity_item"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "item",
        "interactName": "entityItem",
        "function": (entity) => {
          if (entity.isItem()) {
            return entity.getItem();
          } else {
            throw new Error("Entity is not an item entity.");
          }
        }
      }),
      "entityHealth": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_health",
        "nicknames": [
          "EntityHealth",
          "entity_health",
          "entity_health_value",
          "entityHealthValue"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "health",
        "interactName": "entityHealth",
        "function": (entity) => {
          return entity.getHealth();
        }
      }),
      "entityWidth": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_width",
        "nicknames": [
          "EntityWidth",
          "entity_width"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "width",
        "interactName": "entityWidth",
        "function": (entity) => {
          return entity.getWidth();
        }
      }),
      "entityHeight": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_height",
        "nicknames": [
          "EntityHeight",
          "entity_height"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "height",
        "interactName": "entityHeight",
        "function": (entity) => {
          return entity.getHeight();
        }
      }),
      "isBurning": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_isburning",
        "nicknames": [
          "EntityIsburning",
          "entity_is_burning",
          "entityIsBurning"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_burning",
        "interactName": "entityEntityIsBurning",
        "function": (entity) => {
          return entity.isBurning();
        }
      }),
      "isWet": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_iswet",
        "nicknames": [
          "EntityIswet",
          "entity_is_wet",
          "entityIsWet"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_wet",
        "interactName": "entityIsWet",
        "function": (entity) => {
          return entity.isWet();
        }
      }),
      "isCrouching": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_iscrouching",
        "nicknames": [
          "EntityIscrouching",
          "entity_is_crouching",
          "entityIsCrouching"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_crouching",
        "interactName": "entityIsCrouching",
        "function": (entity) => {
          return entity.isCrouching();
        }
      }),
      "isEating": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_iseating",
        "nicknames": [
          "EntityIseating",
          "entity_is_eating",
          "entityIsEating"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_eating",
        "interactName": "entityIsEating",
        "function": (entity) => {
          return entity.isEating();
        }
      }),
      "entityArmor": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_armorinventory",
        "nicknames": [
          "EntityArmorinventory",
          "entity_armor_inventory",
          "entityArmorInventory",
          "entity_armor"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Item"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "armor_inventory",
        "interactName": "entityArmorInventory",
        "function": (entity) => {
          return entity.getArmorInventory();
        }
      }),
      "entityInventoryContents": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_inventory",
        "nicknames": [
          "EntityInventory",
          "entity_inventory",
          "entityInventory",
          "entity_inventory_contents",
          "entityInventoryContents"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Item"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "inventory",
        "interactName": "entityInventory",
        "function": (entity) => {
          return entity.getInventory();
        }
      }),
      "entityModName": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_mod",
        "nicknames": [
          "EntityModname",
          "entity_mod_name",
          "entityModName"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "mod",
        "interactName": "entityMod",
        "function": (entity) => {
          return entity.getModName();
        }
      }),
      "playerTargetBlock": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_targetblock",
        "nicknames": [
          "PlayerTargetblock",
          "player_target_block"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "target_block",
        "interactName": "entityTargetBlock",
        "function": (entity) => {
          return entity.getTargetBlock();
        }
      }),
      "playerTargetEntity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_targetentity",
        "nicknames": [
          "PlayerTargetentity",
          "player_target_entity"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "target_entity",
        "interactName": "entityTargetEntity",
        "function": (entity) => {
          return entity.getTargetEntity();
        }
      }),
      "playerHasGuiOpen": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_hasguiopen",
        "nicknames": [
          "PlayerHasguiopen",
          "player_has_gui_open"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "has_gui_open",
        "interactName": "entityHasGuiOpen",
        "function": (entity) => {
          return entity.hasGuiOpen();
        }
      }),
      "heldItemMain": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_helditem",
        "nicknames": [
          "EntityHelditemMain",
          "entity_held_item_main",
          "entityHeldItemMain"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "held_item_1",
        "interactName": "entityHeldItem",
        "function": (entity) => {
          return entity.getHeldItemMain();
        }
      }),
      "heldItemOff": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_helditemoffhand",
        "nicknames": [
          "EntityHelditemOff",
          "entity_held_item_off",
          "entityHeldItemOff"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "held_item_2",
        "interactName": "entityHeldItemOffHand",
        "function": (entity) => {
          return entity.getHeldItemOffHand();
        }
      }),
      "entitysMounted": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_mounted",
        "nicknames": [
          "EntityMounted",
          "entitys_mounted"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Entity"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "mounted",
        "interactName": "entityMounted",
        "function": (entity) => {
          return entity.isEntityMounted();
        }
      }),
      "itemFrameContents": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_itemframeconte)nts",
        "nicknames": [
          "ItemframeContents",
          "itemframe_contents",
          "itemframeContents",
          "item_frame_contents"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "itemframe_contents",
        "interactName": "entityItemFrameContents",
        "function": (entity) => {
          if (entity.isItemFrame()) {
            return entity.getItemFrameContents();
          } else {
            throw new Error("Entity is not an item frame.");
          }
        }
      }),
      "itemFrameRotation": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_itemframerotation",
        "nicknames": [
          "ItemframeRotation",
          "itemframe_rotation",
          "itemframeRotation",
          "item_frame_rotation"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "itemframe_rotation",
        "interactName": "entityItemFrameRotation",
        "function": (entity) => {
          if (entity.isItemFrame()) {
            return entity.getItemFrameRotation();
          } else {
            throw new Error("Entity is not an item frame.");
          }
        }
      }),
      "entityHurtSound": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_hurtsound",
        "nicknames": [
          "EntityHurtsound",
          "entity_hurt_sound"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "hurtsound",
        "interactName": "entityHurtSound",
        "function": (entity) => {
          return entity.getHurtSound();
        }
      }),
      "entityDeathSound": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_deathsound",
        "nicknames": [
          "EntityDeathsound",
          "entity_death_sound"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "deathsound",
        "interactName": "entityDeathSound",
        "function": (entity) => {
          return entity.getDeathSound();
        }
      }),
      "entityAge": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_age",
        "nicknames": [
          "EntityAge",
          "entity_age"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "age",
        "interactName": "entityAge",
        "function": (entity) => {
          return entity.getAge();
        }
      }),
      "isChild": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_ischild",
        "nicknames": [
          "EntityIschild",
          "entity_is_child",
          "entityIsChild"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_child",
        "interactName": "entityIsChild",
        "function": (entity) => {
          return entity.isChild();
        }
      }),
      "canBreed": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_canbreed",
        "nicknames": [
          "EntityCanbreed",
          "entity_can_breed",
          "entityCanBreed"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "canbreed",
        "interactName": "entityCanBreed",
        "function": (entity) => {
          return entity.canBreed();
        }
      }),
      "isInLove": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_isinlove",
        "nicknames": [
          "EntityIsinlove",
          "entity_is_in_love",
          "entityIsInLove"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_in_love",
        "interactName": "entityIsInLove",
        "function": (entity) => {
          return entity.isInLove();
        }
      }),
      "canBreedWith": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_canbreedwith",
        "nicknames": [
          "EntityCanbreedwith",
          "entity_can_breed_with",
          "entityCanBreedWith"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Entity"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "can_breed_with",
        "interactName": "entityCanBreedWith",
        "function": (entity1, entity2) => {
          return entity1.breadableList.includes(entity2);
        }
      }),
      "entityIsShearable": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_isshearable",
        "nicknames": [
          "EntityIsshearable",
          "entity_is_shearable",
          "entityIsShearable"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "is_shearable",
        "interactName": "entityIsShearable",
        "function": (entity) => {
          return entity.isShearable();
        }
      }),
      "entityNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_nbt",
        "nicknames": [
          "EntityNbt",
          "entity_nbt"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT()",
        "interactName": "entityNbt",
        "function": (entity) => {
          return entity.getNBT();
        }
      }),
      "entityType": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_entitytype",
        "nicknames": [
          "EntityType",
          "entity_type"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "entity_type",
        "interactName": "entityType",
        "function": (entity) => {
          return entity.getEntityType();
        }
      }),
      "entityItemList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_entityitems",
        "nicknames": [
          "EntityItems",
          "entity_items",
          "entityItems",
          "entity_item_list"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Item"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "entity_items",
        "interactName": "entityItems",
        "function": (entity) => {
          return entity.getItemList();
        }
      }),
      "entityFluids": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_entityfluids",
        "nicknames": [
          "EntityFluids",
          "entity_fluids"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Fluid"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "entity_fluids",
        "interactName": "entityFluids",
        "function": (entity) => {
          return entity.getFluids();
        }
      }),
      "entityEnergyStored": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_entityenergystored",
        "nicknames": [
          "EntityEnergyStored",
          "entity_energy_stored"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "entity_stored_fe",
        "interactName": "entityEnergy",
        "function": (entity) => {
          return entity.getEnergyStored();
        }
      }),
      "entityEnergyCapacity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:entity_entityenergycapacity",
        "nicknames": [
          "EntityEnergyCapacity",
          "entity_energy_capacity"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Entity"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "entity_capacity_fe",
        "interactName": "entityEnergyCapacity",
        "function": (entity) => {
          return entity.getEnergyCapacity();
        }
      }),
      "fluidAmount": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_amount",
        "nicknames": [
          "FluidstackAmount",
          "fluidstackAmount",
          "fluid_stack_amount",
          "fluidStackAmount",
          "fluid_stack_amount",
          "fluid_amount"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "amount",
        "interactName": "fluidstackAmount",
        "function": (fluid) => {
          return fluid.getAmount();
        }
      }),
      "fluidBlock": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_block",
        "nicknames": [
          "FluidstackBlock",
          "fluidstackBlock",
          "fluid_stack_block",
          "fluidStackBlock",
          "fluid_stack_block",
          "fluid_block"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Block"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "block",
        "interactName": "fluidstackBlock",
        "function": (fluid) => {
          return fluid.getBlock();
        }
      }),
      "fluidLightLevel": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_light_level",
        "nicknames": [
          "FluidstackLightLevel",
          "fluidstackLightLevel",
          "fluid_stack_light_level",
          "fluidStackLightLevel",
          "fluid_stack_light_level",
          "fluid_light_level"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "light_level",
        "interactName": "fluidstackLightLevel",
        "function": (fluid) => {
          return fluid.getLightLevel();
        }
      }),
      "fluidDensity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_density",
        "nicknames": [
          "FluidstackDensity",
          "fluidstackDensity",
          "fluid_stack_density",
          "fluidStackDensity",
          "fluid_stack_density",
          "fluid_density"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "density",
        "interactName": "fluidstackDensity",
        "function": (fluid) => {
          return fluid.getDensity();
        }
      }),
      "fluidTemperature": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_temperature",
        "nicknames": [
          "FluidstackTemperature",
          "fluidstackTemperature",
          "fluid_stack_temperature",
          "fluidStackTemperature",
          "fluid_stack_temperature",
          "fluid_temperature"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "temperature",
        "interactName": "fluidstackTemperature",
        "function": (fluid) => {
          return fluid.getTemperature();
        }
      }),
      "fluidViscosity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_viscosity",
        "nicknames": [
          "FluidstackViscosity",
          "fluidstackViscosity",
          "fluid_stack_viscosity",
          "fluidStackViscosity",
          "fluid_stack_viscosity",
          "fluid_viscosity"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "viscosity",
        "interactName": "fluidstackViscosity",
        "function": (fluid) => {
          return fluid.getViscosity();
        }
      }),
      "isLighterThanAir": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_lighter_than_air",
        "nicknames": [
          "FluidstackIsLighterThanAir",
          "fluidstackIsLighterThanAir",
          "fluid_stack_is_lighter_than_air",
          "fluidStackIsLighterThanAir",
          "fluid_stack_is_lighter_than_air",
          "fluid_is_lighter_than_air",
          "fluidIsLighterThanAir"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "lighter_than_air",
        "interactName": "fluidstackIsLighterThanAir",
        "function": (fluid) => {
          return fluid.getLighterThanAir();
        }
      }),
      "fluidRarity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_rarity",
        "nicknames": [
          "FluidstackRarity",
          "fluidstackRarity",
          "fluid_stack_rarity",
          "fluidStackRarity",
          "fluid_stack_rarity",
          "fluid_rarity"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "rarity",
        "interactName": "fluidstackRarity",
        "function": (fluid) => {
          return fluid.getRarity();
        }
      }),
      "fluidSoundBucketEmpty": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_sound_bucket_empty",
        "nicknames": [
          "FluidstackSoundBucketEmpty",
          "fluidstackSoundBucketEmpty",
          "fluid_stack_sound_bucket_empty",
          "fluidStackSoundBucketEmpty",
          "fluid_stack_sound_bucket_empty",
          "fluid_sound_bucket_empty"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "sound_bucket_empty",
        "interactName": "fluidstackBucketEmptySound",
        "function": (fluid) => {
          return fluid.getBucketEmptySound();
        }
      }),
      "fluidSoundFluidVaporize": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_sound_fluid_vaporize",
        "nicknames": [
          "FluidstackSoundFluidVaporize",
          "fluidstackSoundFluidVaporize",
          "fluid_stack_sound_fluid_vaporize",
          "fluidStackSoundFluidVaporize",
          "fluid_stack_sound_fluid_vaporize",
          "fluid_sound_fluid_vaporize"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "sound_fluid_vaporize",
        "interactName": "fluidstackFluidVaporizeSound",
        "function": (fluid) => {
          return fluid.getFluidVaporizeSound();
        }
      }),
      "fluidSoundBucketFill": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_sound_bucket_fill",
        "nicknames": [
          "FluidstackSoundBucketFill",
          "fluidstackSoundBucketFill",
          "fluid_stack_sound_bucket_fill",
          "fluidStackSoundBucketFill",
          "fluid_stack_sound_bucket_fill",
          "fluid_sound_bucket_fill"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "sound_bucket_fill",
        "interactName": "fluidstackBucketFillSound",
        "function": (fluid) => {
          return fluid.getBucketFillSound();
        }
      }),
      "fluidBucket": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_bucket",
        "nicknames": [
          "FluidstackBucket",
          "fluidstackBucket",
          "fluid_stack_bucket",
          "fluidStackBucket",
          "fluid_stack_bucket",
          "fluid_bucket"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Item"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "bucket",
        "interactName": "fluidstackBucket",
        "function": (fluid) => {
          return fluid.getBucket();
        }
      }),
      "rawFluidEquals": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_israwfluidequal",
        "nicknames": [
          "FluidstackIsrawfluidequal",
          "fluidstackIsrawfluidequal",
          "fluid_stack_israwfluidequal",
          "fluidStackIsrawfluidequal",
          "fluid_stack_israwfluidequal",
          "fluid_israwfluidequal",
          "isRawFluidEqual"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Fluid"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "=Raw=",
        "interactName": "fluidstackIsRawEqual",
        "function": (fluid1) => {
          return (fluid2) => {
            return fluid1.getUname().replace(new RegExp("\\s\\d+$"), "").toLowerCase() === fluid2.getUname().replace(new RegExp("\\s\\d+$"), "").toLowerCase();
          };
        }
      }),
      "fluidModName": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_mod",
        "nicknames": [
          "FluidstackModname",
          "fluidstackModname",
          "fluid_stack_modname",
          "fluidStackModname",
          "fluid_stack_modname",
          "fluid_mod_name"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "mod",
        "interactName": "fluidstackMod",
        "function": (fluid) => {
          return fluid.getModName();
        }
      }),
      "fluidNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_nbt",
        "nicknames": [
          "FluidstackData",
          "fluidstackData",
          "fluid_stack_data",
          "fluidStackData",
          "fluid_stack_data",
          "fluid_data",
          "fluidData",
          "fluid_NBT",
          "fluidStackNBT",
          "fluid_stack_NBT",
          "fluidstack_NBT",
          "fluidstackNBT"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT()",
        "interactName": "fluidstackNbt",
        "function": (fluid) => {
          return fluid.getNBT();
        }
      }),
      "fluidWithAmount": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_with_amount",
        "nicknames": [
          "FluidstackWithAmount",
          "fluidstackWithAmount",
          "fluid_stack_with_amount",
          "fluidStackWithAmount",
          "fluid_stack_with_amount",
          "fluid_with_amount"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Fluid"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "with_amount",
        "interactName": "fluidstackWithAmount",
        "function": (fluid) => {
          return (amount) => {
            return new IntegratedDynamicsClasses.Fluid({amount}, fluid);
          };
        }
      }),
      "fluidNBTKeys": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_datakeys",
        "nicknames": [
          "FluidstackDataKeys",
          "fluidstackDataKeys",
          "fluid_stack_data_keys",
          "fluidStackDataKeys",
          "fluid_stack_data_keys",
          "fluid_data_keys",
          "fluidDataKeys",
          "fluid_NBT_keys",
          "fluidStackNBTKeys",
          "fluid_stack_NBT_keys",
          "fluidstack_NBT_keys",
          "fluidstackNBTKeys"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "data_keys",
        "interactName": "fluidstackDataKeys",
        "function": (fluid) => {
          const nbt = fluid.getNBT();
          if (!nbt) {
            return [];
          }
          return Object.keys(nbt).filter(key => nbt[key] !== undefined && nbt[key] !== null);
        }
      }),
      "fluidNBTValue": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_datavalue",
        "nicknames": [
          "FluidstackDataValue",
          "fluidstackDataValue",
          "fluid_stack_data_value",
          "fluidStackDataValue",
          "fluid_stack_data_value",
          "fluid_data_value",
          "fluidDataValue",
          "fluid_NBT_value",
          "fluidStackNBTValue",
          "fluid_stack_NBT_value",
          "fluidstack_NBT_value",
          "fluidstackNBTValue"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "data_value",
        "interactName": "fluidstackDataValue",
        "function": (fluid) => {
          return (key) => {
            const nbt = fluid.getNBT();
            if (!nbt || !nbt.hasOwnProperty(key)) {
              return null;
            }
            return nbt[key];
          }
        }
      }),
      "fluidWithNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:itemstack_withdata",
        "nicknames": [
          "FluidstackWithData",
          "fluidstackWithData",
          "fluid_stack_with_data",
          "fluidStackWithData"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": {
            "kind": "Function",
            "from": {
              "kind": "Generic",
              "name": "$1",
              "of": {
                "kind": "Concrete",
                "name": "Fluid"
              }
            },
            "to": {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Concrete",
                "name": "Fluid"
              }
            }
          }
        }, this.globalMap),
        "symbol": "with_data",
        "interactName": "fluidstackWithData",
        "function": (fluid) => {
          return (key) => {
            return (value) => {
              const nbt = fluid.getNBT() || {};
              nbt[key] = value;
              return new item({nbt}, fluid);
            }
          }
        }
      }),
      "fluidTag": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:fluidstack_tag",
        "nicknames": [
          "FluidstackTag",
          "fluidstackTag",
          "fluidstackTagStacks",
          "fluidstackTagStack"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Fluid"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "fluid_tag_names",
        "interactName": "fluidstackTags",
        "function": (fluid) => {
          return fluid.getTagNames();
        }
      }),
      "fluidTagStacks": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:string_fluidtag",
        "nicknames": [
          "FluidstackTagStacks",
          "fluidStackTagStacks",
          "fluid_stack_tag_stacks"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Fluid"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "fluid_tag_values",
        "interactName": "stringFluidsByTag",
        "function": (tag) => {
          throw new Error("Fluid tag values is infeasible without a registry. This is a placeholder function.");
        }
      }),
      "apply": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_apply",
        "nicknames": [
          "operatorApply"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$2",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type2"
                    }
                  }
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "apply",
        "interactName": "operatorApply",
        "serializer": "integrateddynamics:curry",
        "function": (op) => {
          return (arg) => {
            op.parsedSignature.typeMap.unify(op.parsedSignature.getInput(0), a?.parsedSignature ? a.parsedSignature.getOutput() : a);

            return op.apply(arg);
          };
        }
      }),
      "apply2": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_apply2",
        "nicknames": [
          "operatorApply_2"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$2",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  },
                  "to": {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$3",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type2"
                      }
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$4",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type3"
                      }
                    }
                  }
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2"
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3"
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "apply2",
        "interactName": "operatorApply2",
        "serializer": "integrateddynamics:curry",
        "function": (op) => {
          return (arg1) => {
            return (arg2) => {
              op.parsedSignature.typeMap.unify(op.parsedSignature.getInput(0), a);
              op.parsedSignature.typeMap.unify(op.parsedSignature.getInput(1), b);

              return op.apply(arg1).apply(arg2);
            };
          };
        }
      }),
      "apply3": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_apply3",
        "nicknames": [
          "operatorApply_3"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$2",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  },
                  "to": {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$3",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type2"
                      }
                    },
                    "to": {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$4",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type3"
                        }
                      },
                      "to": {
                        "kind": "Generic",
                        "name": "$5",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type4"
                        }
                      }
                    }
                  }
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2"
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3"
                  },
                  "to": {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$4"
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$5"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "apply3",
        "interactName": "operatorApply3",
        "serializer": "integrateddynamics:curry",
        "function": (op) => {
          return (arg1) => {
            return (arg2) => {
              return (arg3) => {
                op.parsedSignature.typeMap.unify(op.parsedSignature.getInput(0), a);
                op.parsedSignature.typeMap.unify(op.parsedSignature.getInput(1), b);
                op.parsedSignature.typeMap.unify(op.parsedSignature.getInput(2), c);

                return op.apply(arg1).apply(arg2).apply(arg3);
              };
            };
          };
        }
      }),
      "applyn": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_apply_n",
        "nicknames": [
          "operatorApplyN"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$2",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type2"
                    }
                  }
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$4",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Generic",
                        "name": "$2"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$5",
                  "of": {
                    "kind": "Any",
                    "typeID": "$type3"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "apply_n",
        "interactName": "operatorApply_n",
        "serializer": "integrateddynamics:curry",
        "function": (op) => {
          return (args) => {
            args.forEach((arg, i) => {
              if (arg === undefined || arg === null) {
                throw new Error("applyn requires all arguments to be defined and non-null.");
              }
              op.parsedSignature.typeMap.unify(op.parsedSignature.getInput(i), arg);
              op = op.apply(arg);
            });
            return op;
          };
        }
      }),
      "apply0": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_apply0",
        "nicknames": [
          "operatorApply_0"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Generic",
              "name": "$1",
              "of": {
                "kind": "Operator",
                "args": [
                  {
                    "kind": "Any",
                    "typeID": "$type1"
                  }
                ]
              }
            },
            {
              "kind": "Generic",
              "name": "$2",
              "of": {
                "kind": "Any",
                "typeID": "$type1"
              }
            }
          ]
        }, this.globalMap),
        "symbol": "apply0",
        "interactName": "operatorApply0",
        "serializer": "integrateddynamics:curry",
        "function": (op) => {
          return () => {
            return op.apply();
          };
        }
      }),
      "map": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_map",
        "nicknames": [
          "operatorMap"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Operator",
                "args": [
                  {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$1",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$2",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type2"
                      }
                    }
                  }
                ]
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Generic",
                        "name": "$1"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$4",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Generic",
                        "name": "$2"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "map",
        "interactName": "operatorMap",
        "function": (op) => {
          return (list) => {
            return list.map(item => op.apply(item));
          };
        }
      }),
      "filter": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_filter",
        "nicknames": [
          "operatorFilter"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Predicate",
                "args": [
                  {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$1",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$2",
                      "of": {
                        "kind": "Concrete",
                        "name": "Boolean"
                      }
                    }
                  }
                ]
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Generic",
                        "name": "$1"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$4",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Generic",
                        "name": "$1"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "filter",
        "interactName": "operatorFilter",
        "function": (predicate) => {
          return (list) => {
            return list.filter(item => predicate.apply(item));
          };
        }
      }),
      "conjunction": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_conjunction",
        "nicknames": [
          "operatorConjunction"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Predicate",
                "args": [
                  {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$1",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$2",
                      "of": {
                        "kind": "Concrete",
                        "name": "Boolean"
                      }
                    }
                  }
                ]
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Predicate",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$1",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      },
                      "to": {
                        "kind": "Generic",
                        "name": "$2",
                        "of": {
                          "kind": "Concrete",
                          "name": "Boolean"
                        }
                      }
                    }
                  ]
                },
                "to": {
                  "kind": "Predicate",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$1",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      },
                      "to": {
                        "kind": "Generic",
                        "name": "$2",
                        "of": {
                          "kind": "Concrete",
                          "name": "Boolean"
                        }
                      }
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": ".&&.",
        "interactName": "operatorConjunction",
        "function": (predicate1) => {
          return (predicate2) => {
            return (input) => {
              return predicate1.apply(input) && predicate2.apply(input);
            };
          };
        }
      }),
      "disjunction": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_disjunction",
        "nicknames": [
          "operatorDisjunction"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Predicate",
                "args": [
                  {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$1",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$2",
                      "of": {
                        "kind": "Concrete",
                        "name": "Boolean"
                      }
                    }
                  }
                ]
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Predicate",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$1",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      },
                      "to": {
                        "kind": "Generic",
                        "name": "$2",
                        "of": {
                          "kind": "Concrete",
                          "name": "Boolean"
                        }
                      }
                    }
                  ]
                },
                "to": {
                  "kind": "Predicate",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$1",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      },
                      "to": {
                        "kind": "Generic",
                        "name": "$2",
                        "of": {
                          "kind": "Concrete",
                          "name": "Boolean"
                        }
                      }
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": ".||.",
        "interactName": "operatorDisjunction",
        "function": (predicate1) => {
          return (predicate2) => {
            return (input) => {
              return predicate1.apply(input) || predicate2.apply(input);
            };
          };
        }
      }),
      "negation": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_negation",
        "nicknames": [
          "operatorNegation"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Predicate",
                "args": [
                  {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$1",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$2",
                      "of": {
                        "kind": "Concrete",
                        "name": "Boolean"
                      }
                    }
                  }
                ]
              },
              "to": {
                "kind": "Predicate",
                "args": [
                  {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$1",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$2",
                      "of": {
                        "kind": "Concrete",
                        "name": "Boolean"
                      }
                    }
                  }
                ]
              }
            }
          ]
        }, this.globalMap),
        "symbol": "!.",
        "interactName": "operatorNegation",
        "function": (predicate) => {
          return (input) => {
            return !predicate.apply(input);
          };
        }
      }),
      "pipe": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_pipe",
        "nicknames": [
          "operatorPipe"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Operator",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$4",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      },
                      "to": {
                        "kind": "Generic",
                        "name": "$5",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type2"
                        }
                      }
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Operator",
                    "args": [
                      {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$5",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type2"
                          }
                        },
                        "to": {
                          "kind": "Generic",
                          "name": "$6",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type3"
                          }
                        }
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Operator",
                    "args": [
                      {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$4",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type1"
                          }
                        },
                        "to": {
                          "kind": "Generic",
                          "name": "$6",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type3"
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": ".",
        "interactName": "operatorPipe",
        "serializer": "integrateddynamics:combined.pipe",
        "function": (f) => {
          return (g) => {
            f.parsedSignature.pipe(g.parsedSignature);
            return (x) => {
              return g.apply((f.apply(x)));
            };
          };
        }
      }),
      "pipe.2": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_pipe2",
        "nicknames": [
          "operatorPipe2",
          "pipe2"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Operator",
                "args": [
                  {
                    "kind": "Function",
                    "from": {
                      "kind": "Generic",
                      "name": "$1",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    },
                    "to": {
                      "kind": "Generic",
                      "name": "$2",
                      "of": {
                        "kind": "Any",
                        "typeID": "$type2"
                      }
                    }
                  }
                ]
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Operator",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$1",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      },
                      "to": {
                        "kind": "Generic",
                        "name": "$3",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type3"
                        }
                      }
                    }
                  ]
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Operator",
                    "args": [
                      {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$2",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type2"
                          }
                        },
                        "to": {
                          "kind": "Function",
                          "from": {
                            "kind": "Generic",
                            "name": "$3",
                            "of": {
                              "kind": "Any",
                              "typeID": "$type3"
                            }
                          },
                          "to": {
                            "kind": "Generic",
                            "name": "$4",
                            "of": {
                              "kind": "Any",
                              "typeID": "$type4"
                            }
                          }
                        }
                      }
                    ]
                  },
                  "to": {
                    "kind": "Operator",
                    "args": [
                      {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$1",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type1"
                          }
                        },
                        "to": {
                          "kind": "Generic",
                          "name": "$4",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type4"
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": ".2",
        "interactName": "operatorPipe2",
        "serializer": "integrateddynamics:combined.pipe",
        "function": (f) => {
          return (g) => {
            return (h) => {
              f.parsedSignature.typeMap.unify(f.parsedSignature.getOutput(), h.parsedSignature.getInput(0));
              g.parsedSignature.typeMap.unify(g.parsedSignature.getOutput(), h.parsedSignature.getInput(1));

              return (x) => {
                return h.apply(f.apply(x)).apply(g.apply(x));
              }
            }
          };
        }
      }),
      "flip": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_flip",
        "nicknames": [
          "operatorFlip"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Operator",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$2",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      },
                      "to": {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$3",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type2"
                          }
                        },
                        "to": {
                          "kind": "Generic",
                          "name": "$4",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type3"
                          }
                        }
                      }
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$5",
                "of": {
                  "kind": "Operator",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Generic",
                        "name": "$3",
                        "of": {
                          "kind": "Any",
                          "typeID": "$type2"
                        }
                      },
                      "to": {
                        "kind": "Function",
                        "from": {
                          "kind": "Generic",
                          "name": "$2",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type1"
                          }
                        },
                        "to": {
                          "kind": "Generic",
                          "name": "$4",
                          "of": {
                            "kind": "Any",
                            "typeID": "$type3"
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "flip",
        "interactName": "operatorFlip",
        "serializer": "integrateddynamics:combined.flip",
        "function": (op) => {
          return (arg1) => {
            return (arg2) => {

              return op.apply(arg2).apply(arg1);
            };
          };
        }
      }),
      "reduce": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_reduce",
        "nicknames": [
          "operatorReduce"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Operator",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Any",
                        "typeID": "$type1"
                      },
                      "to": {
                        "kind": "Function",
                        "from": {
                          "kind": "Any",
                          "typeID": "$type1"
                        },
                        "to": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      }
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Any",
                      "typeID": "$type1"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "reduce",
        "interactName": "operatorReduce",
        "function": (op) => {
          return (list) => {
            return (startingValue) => {
              let result = startingValue;
              for (let item of list) {
                result = op.apply(result).apply(item);
              }
              return result;
            }
          };
        }
      }),
      "reduce1": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_reduce1",
        "nicknames": [
          "operatorReduce1"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Operator",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Any",
                        "typeID": "$type1"
                      },
                      "to": {
                        "kind": "Function",
                        "from": {
                          "kind": "Any",
                          "typeID": "$type1"
                        },
                        "to": {
                          "kind": "Any",
                          "typeID": "$type1"
                        }
                      }
                    }
                  ]
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Any",
                        "typeID": "$type1"
                      }
                    ]
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Any",
                    "typeID": "$type1"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "reduce1",
        "interactName": "operatorReduce1",
        "function": (op) => {
          return (list) => {
            list = [...list];
            let result = list.shift();
            for (let item of list) {
              result = op.apply(result).apply(item);
            }
            return result;
          };
        }
      }),
      "opByName": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator_by_name",
        "nicknames": [
          "operatorByName"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Operator",
                  "args": [
                    {
                      "kind": "Function",
                      "from": {
                        "kind": "Any",
                        "typeID": "$type1"
                      },
                      "to": {
                        "kind": "Any",
                        "typeID": "$type2"
                      }
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "op_by_name",
        "interactName": "stringOperatorByName",
        "function": (name) => {
          return operatorRegistry.baseOperators.find(op => op.internalName === name);
        }
      }),
      "NBTSize": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_size",
        "nicknames": [
          "nbtCompoundSize"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.size",
        "interactName": "nbtSize",
        "function": (nbt) => {
          return Object.keys(nbt).length;
        }
      }),
      "NBTKeys": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_keys",
        "nicknames": [
          "nbtCompoundKeys"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.keys",
        "interactName": "nbtKeys",
        "function": (nbt) => {
          return Object.keys(nbt);
        }
      }),
      "NBTHasKey": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_haskey",
        "nicknames": [
          "nbtCompoundHaskey"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.has_key",
        "interactName": "nbtHasKey",
        "function": (nbt) => {
          return (key) => {
            return nbt.hasOwnProperty(key);
          };
        }
      }),
      "NBTValueType": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_type",
        "nicknames": [
          "nbtCompoundValueType"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.type",
        "interactName": "nbtType",
        "function": (nbt) => {
          return (key) => {
            if (!nbt.hasOwnProperty(key)) {
              throw new Error(`${key} does not exist in ${JSON.stringify(nbt)}`);
            }
          }
        }
      }),
      "compoundValueAny": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_tag",
        "nicknames": [
          "nbtCompoundValueTag"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_tag",
        "interactName": "nbtGetTag",
        "function": (nbt) => {
          return (key) => {
            return nbt[key];
          }
        }
      }),
      "compoundValueBoolean": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_boolean",
        "nicknames": [
          "nbtCompoundValueBoolean"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_boolean",
        "interactName": "nbtGetBoolean",
        "function": (nbt) => {
          return (key) => {
            return nbt[key];
          }
        }
      }),
      "compoundValueInteger": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_integer",
        "nicknames": [
          "nbtCompoundValueInteger"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_integer",
        "interactName": "nbtGetInteger",
        "function": (nbt) => {
          return (key) => {
            let value = nbt[key];
            if (value.type === "integer") {
              return IntegratedDynamicsClasses.Integer(value.value);
            }
            throw new Error(`${key} is not an integer in ${nbt.stringify()}`);
          }
        }
      }),
      "compoundValueLong": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_long",
        "nicknames": [
          "nbtCompoundValueLong"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Long"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_long",
        "interactName": "nbtGetLong",
        "function": (nbt) => {
          return (key) => {
            let value = nbt[key];
            if (value.type === "long") {
              return new IntegratedDynamicsClasses.Long(value.value);
            }
            throw new Error(`${key} is not a long in ${nbt.stringify(nbt)}`);
          }
        }
      }),
      "compoundValueDouble": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_double",
        "nicknames": [
          "nbtCompoundValueDouble"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Double"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_double",
        "interactName": "nbtGetDouble",
        "function": (nbt) => {
          return (key) => {
            let value = nbt[key];
            if (value.type === "double") {
              return IntegratedDynamicsClasses.Double(value.value);
            }
            throw new Error(`${key} is not a double in ${nbt.stringify()}`);
          }
        }
      }),
      "compoundValueString": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_string",
        "nicknames": [
          "nbtCompoundValueString"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_string",
        "interactName": "nbtGetString",
        "function": (nbt) => {
          return (key) => {
            return nbt[key];
          }
        }
      }),
      "compoundValueNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_compound",
        "nicknames": [
          "nbtCompoundValueCompound"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_compound",
        "interactName": "nbtGetCompound",
        "function": (nbt) => {
          return (key) => {
            return new IntegratedDynamicsClasses.NBT(nbt[key]);
          }
        }
      }),
      "compoundValueListNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_list_tag",
        "nicknames": [
          "nbtCompoundValueListTag",
          "nbtCompoundValueList"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "NBT"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_list_tag",
        "interactName": "nbtGetListTag",
        "function": (nbt) => {
          return (key) => {
            let value = nbt[key];
            let list = value.list;
            if (value.ListType != "nbt") throw new Error(`${key} is not a list of NBT in ${nbt.stringify()}`);
            return list.map(v => new IntegratedDynamicsClasses.NBT(v));
          }
        }
      }),
      "compoundValueListByte": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_list_byte",
        "nicknames": [
          "nbtCompoundValueListByte"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "Integer"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_list_byte",
        "interactName": "nbtGetListByte",
        "function": (nbt) => {
          return (key) => {
            let value = nbt[key];
            let list = value.list;
            if (value.ListType != "byte") throw new Error(`${key} is not a list of byte in ${nbt.stringify()}`);
            return list.map(v => IntegratedDynamicsClasses.Integer(v));
          }
        }
      }),
      "compoundValueListInteger": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_list_int",
        "nicknames": [
          "nbtCompoundValueListInt"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "Integer"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_list_int",
        "interactName": "nbtGetListInt",
        "function": (nbt) => {
          return (key) => {
            let value = nbt[key];
            let list = value.list;
            if (value.ListType != "int") throw new Error(`${key} is not a list of int in ${nbt.stringify()}`);
            return list.map(v => IntegratedDynamicsClasses.Integer(v));
          }
        }
      }),
      "compoundValueListLong": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_value_list_long",
        "nicknames": [
          "nbtCompoundValueListLong"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "Long"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.get_list_long",
        "interactName": "nbtGetListLong",
        "function": (nbt) => {
          return (key) => {
            let value = nbt[key];
            let list = value.list;
            if (value.ListType != "long") throw new Error(`${key} is not a list of long in ${nbt.stringify()}`);
            return list.map(v => new IntegratedDynamicsClasses.Long(v));
          }
        }
      }),
      "NBTWithout": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_without",
        "nicknames": [
          "nbtCompoundWithout"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.without",
        "interactName": "nbtWithout",
        "function": (nbt) => {
          return (key) => {
            return nbt.remove(key);
          }
        }
      }),
      "NBTWithBoolean": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_boolean",
        "nicknames": [
          "nbtCompoundWithBoolean"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Boolean"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_boolean",
        "interactName": "nbtWithBoolean"
      }),
      "NBTWithShort": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_short",
        "nicknames": [
          "nbtCompoundWithShort"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_short",
        "interactName": "nbtWithShort"
      }),
      "NBTWithInteger": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_integer",
        "nicknames": [
          "nbtCompoundWithInteger"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_integer",
        "interactName": "nbtWithInteger"
      }),
      "NBTWithLong": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_long",
        "nicknames": [
          "nbtCompoundWithLong"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Long"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_long",
        "interactName": "nbtWithLong"
      }),
      "NBTWithDouble": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_double",
        "nicknames": [
          "nbtCompoundWithDouble"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Double"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_double",
        "interactName": "nbtWithDouble"
      }),
      "NBTWithFloat": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_float",
        "nicknames": [
          "nbtCompoundWithFloat"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Double"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_float",
        "interactName": "nbtWithFloat"
      }),
      "NBTWithString": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_string",
        "nicknames": [
          "nbtCompoundWithString"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "String"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_string",
        "interactName": "nbtWithString"
      }),
      "NBTWithNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_tag",
        "nicknames": [
          "nbtCompoundWithCompound"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_tag",
        "interactName": "nbtWithTag"
      }),
      "NBTWithNBTList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_list_tag",
        "nicknames": [
          "nbtCompoundWithListTag"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Concrete",
                          "name": "NBT"
                        }
                      ]
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_tag_list",
        "interactName": "nbtWithTagList"
      }),
      "NBTWithByteList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_list_byte",
        "nicknames": [
          "nbtCompoundWithListByte"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Concrete",
                          "name": "Integer"
                        }
                      ]
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_byte_list",
        "interactName": "nbtWithByteList"
      }),
      "NBTWithIntegerList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_list_int",
        "nicknames": [
          "nbtCompoundWithListInt"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Concrete",
                          "name": "Integer"
                        }
                      ]
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_int_list",
        "interactName": "nbtWithIntList"
      }),
      "NBTWithLongList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_with_list_long",
        "nicknames": [
          "nbtCompoundWithListLong"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "String"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Concrete",
                          "name": "Long"
                        }
                      ]
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.with_list_long",
        "interactName": "nbtWithListLong"
      }),
      "NBTSubset": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_subset",
        "nicknames": [
          "nbtCompoundSubset"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.⊆",
        "interactName": "nbtIsSubset"
      }),
      "NBTUnion": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_union",
        "nicknames": [
          "nbtCompoundUnion"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.∪",
        "interactName": "nbtUnion"
      }),
      "NBTIntersection": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_intersection",
        "nicknames": [
          "nbtCompoundIntersection"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.∩",
        "interactName": "nbtIntersection"
      }),
      "NBTMinus": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_compound_minus",
        "nicknames": [
          "nbtCompoundMinus"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT{}.∖",
        "interactName": "nbtMinus"
      }),
      "nbtAsBoolean": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_boolean",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_boolean",
        "interactName": "nbtAsBoolean"
      }),
      "nbtAsByte": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_byte",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_byte",
        "interactName": "nbtAsByte"
      }),
      "nbtAsShort": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_short",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_short",
        "interactName": "nbtAsShort"
      }),
      "nbtAsInt": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_int",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_int",
        "interactName": "nbtAsInt"
      }),
      "nbtAsLong": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_long",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Long"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_long",
        "interactName": "nbtAsLong"
      }),
      "nbtAsDouble": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_double",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_double",
        "interactName": "nbtAsDouble"
      }),
      "nbtAsFloat": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_float",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_float",
        "interactName": "nbtAsFloat"
      }),
      "nbtAsString": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_string",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_string",
        "interactName": "nbtAsString"
      }),
      "nbtAsTagList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_tag_list",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_tag_list",
        "interactName": "nbtAsTagList"
      }),
      "nbtAsByteList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_byte_list",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_byte_list",
        "interactName": "nbtAsByteList"
      }),
      "nbtAsIntList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_int_list",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_int_list",
        "interactName": "nbtAsIntList"
      }),
      "nbtAsLongList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_as_long_list",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Long"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.as_long_list",
        "interactName": "nbtAsLongList"
      }),
      "nbtFromBoolean": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_boolean",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "CHANGE ME"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_boolean",
        "interactName": "booleanAsNbt"
      }),
      "nbtFromShort": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_short",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_short",
        "interactName": "shortAsNbt"
      }),
      "nbtFromByte": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_byte",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_byte",
        "interactName": "byteAsNbt"
      }),
      "nbtFromInt": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_int",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_int",
        "interactName": "integerAsNbt"
      }),
      "nbtFromLong": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_long",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Long"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_long",
        "interactName": "longAsNbt"
      }),
      "nbtFromDouble": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_double",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_double",
        "interactName": "doubleAsNbt"
      }),
      "nbtFromFloat": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_float",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_float",
        "interactName": "floatAsNbt"
      }),
      "nbtFromString": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_string",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_string",
        "interactName": "stringAsNbt"
      }),
      "nbtFromTagList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_tag_list",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "NBT"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_tag_list",
        "interactName": "tagListAsNbt"
      }),
      "nbtFromByteList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_byte_list",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_byte_list",
        "interactName": "byteListAsNbt"
      }),
      "nbtFromIntList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_int_list",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Integer"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_int_list",
        "interactName": "intListAsNbt"
      }),
      "nbtFromLongList": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_from_long_list",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Long"
                    }
                  ]
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.from_long_list",
        "interactName": "longListAsNbt"
      }),
      "nbtPathMatchFirst": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_path_match_first",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.path_match_first",
        "interactName": "stringNbtPathMatchFirst"
      }),
      "nbtPathMatchAll": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_path_match_all",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "List",
                    "params": [
                      {
                        "kind": "Concrete",
                        "name": "NBT"
                      }
                    ]
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.path_match_all",
        "interactName": "stringNbtPathMatchAll"
      }),
      "NBTPathTest": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:nbt_path_test",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "String"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "NBT"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Boolean"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "NBT.path_test",
        "interactName": "stringNbtPathTest"
      }),
      "ingredientsItems": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_items",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Item"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.items",
        "interactName": "ingredientsItems"
      }),
      "ingredientsFluids": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_fluids",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Fluid"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.fluids",
        "interactName": "ingredientsFluids"
      }),
      "ingredientsEnergies": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_energies",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "List",
                  "params": [
                    {
                      "kind": "Concrete",
                      "name": "Long"
                    }
                  ]
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.energies",
        "interactName": "ingredientsEnergies"
      }),
      "ingredientsWithItem": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_with_item",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "Kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Item"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "Ingredients"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.with_item",
        "interactName": "ingredientsWithItem"
      }),
      "ingredientsWithFluid": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_with_fluid",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "Kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Fluid"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "Ingredients"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.with_fluid",
        "interactName": "ingredientsWithFluid"
      }),
      "ingredientsWithEnergy": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_with_energy",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "Kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Long"
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "Ingredients"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.with_energy",
        "interactName": "ingredientsWithEnergy"
      }),
      "ingredientsWithItems": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_with_items",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "Kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Concrete",
                          "name": "Item"
                        }
                      ]
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "Ingredients"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.with_items",
        "interactName": "ingredientsWithItems"
      }),
      "ingredientsWithFluids": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_with_fluids",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "Kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Concrete",
                          "name": "Fluid"
                        }
                      ]
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "Ingredients"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.with_fluids",
        "interactName": "ingredientsWithFluids"
      }),
      "ingredientsWithEnergies": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:ingredients_with_energies",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "Kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Integer"
                  }
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "List",
                      "params": [
                        {
                          "kind": "Concrete",
                          "name": "Long"
                        }
                      ]
                    }
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "Ingredients"
                    }
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Ingr.with_energies",
        "interactName": "ingredientsWithEnergies"
      }),
      "recipeInput": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:recipe_input",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Recipe"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "recipe_in",
        "interactName": "recipeInput"
      }),
      "recipeOutput": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:recipe_output",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Recipe"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "recipe_out",
        "interactName": "recipeOutput"
      }),
      "recipeWithInput": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:recipe_with_input",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Recipe"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Ingredients"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Recipe"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Recipe.with_in",
        "interactName": "recipeWithInput"
      }),
      "recipeWithOutput": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:recipe_with_output",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Recipe"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Ingredients"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Recipe"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Recipe.with_out",
        "interactName": "recipeWithOutput"
      }),
      "recipeWithInputOutput": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:recipe_with_input_output",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Ingredients"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Ingredients"
                  }
                },
                "to": {
                  "kind": "Generic",
                  "name": "$3",
                  "of": {
                    "kind": "Concrete",
                    "name": "Recipe"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "Recipe.with_io",
        "interactName": "ingredientsWithInputOutput"
      }),
      "parseBoolean": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.parse.valuetype.integrateddynamics.boolean",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any"
                },
                "typeID": "$type1"
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "parse_boolean",
        "interactName": "stringParseAsBoolean"
      }),
      "parseDouble": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.parse.valuetype.integrateddynamics.double",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any"
                },
                "typeID": "$type1"
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "parse_double",
        "interactName": "stringParseAsDouble"
      }),
      "parseInteger": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.parse.valuetype.integrateddynamics.integer",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any"
                },
                "typeID": "$type1"
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "parse_integer",
        "interactName": "stringParseAsInteger"
      }),
      "parseLong": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.parse.valuetype.integrateddynamics.long",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any"
                },
                "typeID": "$type1"
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Long"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "parse_long",
        "interactName": "stringParseAsLong"
      }),
      "parseNBT": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.parse.valuetype.integrateddynamics.nbt",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any"
                },
                "typeID": "$type1"
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "NBT"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "parse_nbt",
        "interactName": "stringParseAsNbt"
      }),
      "choice": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:general_choice",
        "nicknames": [
          "generalChoice"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Boolean"
                }
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Any"
                  },
                  "typeID": "$type1"
                },
                "to": {
                  "kind": "Function",
                  "from": {
                    "kind": "Generic",
                    "name": "$3",
                    "of": {
                      "kind": "Concrete",
                      "name": "Any"
                    },
                    "typeID": "$type1"
                  },
                  "to": {
                    "kind": "Generic",
                    "name": "$4",
                    "of": {
                      "kind": "Concrete",
                      "name": "Any"
                    },
                    "typeID": "$type1"
                  }
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "?",
        "interactName": "booleanChoice"
      }),
      "generalIdentity": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:general_identity",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any"
                },
                "typeID": "$type1"
              },
              "to": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any"
                },
                "typeID": "$type1"
              }
            }
          ]
        }, this.globalMap),
        "symbol": "id",
        "interactName": "anyIdentity"
      }),
      "generalConstant": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:general_constant",
        "nicknames": [],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Any"
                },
                "typeID": "$type1"
              },
              "to": {
                "kind": "Function",
                "from": {
                  "kind": "Generic",
                  "name": "$2",
                  "of": {
                    "kind": "Concrete",
                    "name": "Any"
                  },
                  "typeID": "$type2"
                },
                "to": {
                  "kind": "Generic",
                  "name": "$1",
                  "of": {
                    "kind": "Concrete",
                    "name": "Any"
                  },
                  "typeID": "$type1"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "K",
        "interactName": "anyConstant"
      }),
      "integerToDouble": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.castintegrateddynamics_integer__integrateddynamics_double",
        "nicknames": [
          "intToDouble",
          "integerDouble"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "()",
        "interactName": "integerIntegerToDouble"
      }),
      "integerToLong": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.castintegrateddynamics_integer__integrateddynamics_long",
        "nicknames": [
          "intToLong",
          "integerLong"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Long"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "()",
        "interactName": "integerIntegerToLong"
      }),
      "doubleToInteger": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.castintegrateddynamics_double__integrateddynamics_integer",
        "nicknames": [
          "doubleToInt",
          "doubleInteger"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "()",
        "interactName": "doubleDoubleToInteger"
      }),
      "doubleToLong": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.castintegrateddynamics_double__integrateddynamics_long",
        "nicknames": [
          "doubleToLong"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Long"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "()",
        "interactName": "doubleDoubleToLong"
      }),
      "longToInteger": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.castintegrateddynamics_long__integrateddynamics_integer",
        "nicknames": [
          "longToInt",
          "longInteger"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Long"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Integer"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "()",
        "interactName": "longLongToInteger"
      }),
      "longToDouble": new IntegratedDynamicsClasses.Operator({
        "internalName": "integrateddynamics:operator.integrateddynamics.castintegrateddynamics_long__integrateddynamics_double",
        "nicknames": [
          "longToDouble",
          "longDouble"
        ],
        "parsedSignature": new IntegratedDynamicsClasses.ParsedSignature({
          "kind": "Operator",
          "args": [
            {
              "kind": "Function",
              "from": {
                "kind": "Generic",
                "name": "$1",
                "of": {
                  "kind": "Concrete",
                  "name": "Long"
                }
              },
              "to": {
                "kind": "Generic",
                "name": "$2",
                "of": {
                  "kind": "Concrete",
                  "name": "Double"
                }
              }
            }
          ]
        }, this.globalMap),
        "symbol": "()",
        "interactName": "longLongToDouble"
      })
    },
    "typeSerializers": {
      "int": {
        "valueType": "integrateddynamics:integer",
        "nbtType": "int"
      },
      "integer": {
        "valueType": "integrateddynamics:integer",
        "nbtType": "int"
      },
      "long": {
        "valueType": "integrateddynamics:long",
        "nbtType": "long"
      },
      "double": {
        "valueType": "integrateddynamics:double",
        "nbtType": "double"
      },
      "boolean": {
        "valueType": "integrateddynamics:boolean",
        "nbtType": "boolean"
      },
      "string": {
        "valueType": "integrateddynamics:string",
        "nbtType": "string"
      }
    }
  }
}
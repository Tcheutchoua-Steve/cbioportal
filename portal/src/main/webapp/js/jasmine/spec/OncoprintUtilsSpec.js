describe("OncoprintUtils", function() {

    describe("is_discrete", function() {

        it("should be false if it is passed a number", function() {
            expect(OncoprintUtils.is_discrete(1)).toBe(false);
        });

        it("should be true if it is passed a string (actually, anything that is not a number)", function() {
            expect(OncoprintUtils.is_discrete("a")).toBe(true);
            expect(OncoprintUtils.is_discrete("")).toBe(true);
            expect(OncoprintUtils.is_discrete(undefined)).toBe(true);
            expect(OncoprintUtils.is_discrete([])).toBe(true);
            expect(OncoprintUtils.is_discrete({})).toBe(true);
        });
    });

    describe("nest_data", function() {

        it("nests on the key 'sample'", function() {
            var sample = { "sample": "sample_0",
                "rppa": "UPREGULATED",
                "gene": "GeneA",
                "cna": "HEMIZYGOUSLYDELETED" };

            var samples = [ sample ];
            expect(OncoprintUtils.nest_data(samples))
                .toEqual([ {key: "sample_0", values: [ sample ]} ]);
        });
    });

    describe("get_attr", function() {

        it("extracts a gene if it's given a piece of genomic data,", function() {
            expect(OncoprintUtils.get_attr({gene: "EGFR", blahblah: "foobar"}))
                .toBe("EGFR");
        });

        it("even if there's no actual data", function() {
            expect(OncoprintUtils.get_attr({gene: "EGFR"}))
                .toBe("EGFR");
        });

        it("and an attr_id if it is a general attribute (e.g. clinical data)", function() {
            expect(OncoprintUtils.get_attr({attr_id: "VITAL_STATUS", helloworld: "blah"}))
                .toBe("VITAL_STATUS");
        });

        it("again, even if there's no actual value", function() {
            expect(OncoprintUtils.get_attr({attr_id: "VITAL_STATUS"}))
                .toBe("VITAL_STATUS");
        });

        describe("and even does a little bit of data validation", function() {

            it("throws an error if there is neither an attr_id nor a gene", function() {
                expect(function() {
                    OncoprintUtils.get_attr({});
                }).toThrow("datum has neither a gene nor an attr_id: " + JSON.stringify({}));

                expect(function() {
                    OncoprintUtils.get_attr({a: 1});
                }).toThrow("datum has neither a gene nor an attr_id: " + JSON.stringify({a: 1}));
            });
        });
    });

    describe("filter_by_attributes", function() {
        it("filters pseudodata", function() {
            var foobar = {a: 1, b: 1, gene: 'foobar'};
            var data = [foobar, {a: 1, gene:"bar"}];
            var attributes = ['foobar'];

            expect(OncoprintUtils.filter_by_attributes(data, attributes)).toEqual([ foobar ]);
        });

        it("throws an error if there is data without gene or attr_id", function() {
            var data = [{a: 1}];
            var attributes = ['foobar'];

            expect(function() {
                OncoprintUtils.filter_by_attributes(data, attributes)
            }).toThrow( "datum has neither a gene nor an attr_id: " + JSON.stringify({a: 1}));
        });

        it("filters by multiple genes", function() {
            var data = [{
            "sample": "sample_0",
            "rppa": "UPREGULATED",
            "gene": "GeneA",
            "cna": "HEMIZYGOUSLYDELETED"
            },
            {
            "sample": "sample_0",
            "gene": "GeneB",
            "mutation": "FOO MUTATION",
            "cna": "DIPLOID"
            }]

        var attributes = ["GeneA", "GeneB"];

        expect(OncoprintUtils.filter_by_attributes(data, attributes)).toEqual(data);

        });

        it("filters by a single gene", function() {
            var GeneA = {
            "sample": "sample_0",
            "rppa": "UPREGULATED",
            "gene": "GeneA",
            "cna": "HEMIZYGOUSLYDELETED"
            };

            var data = [GeneA, {
            "sample": "sample_0",
            "gene": "GeneB",
            "mutation": "FOO MUTATION",
            "cna": "DIPLOID"
            }];

            var attributes = ["GeneA"];

            expect(OncoprintUtils.filter_by_attributes(data, attributes)).toEqual([GeneA]);
        });

        it("filters by a single attribute", function() {
            var continuous = {
            "sample": "sample_0",
            "attr_val": 5090,
            "attr_id": "CONTINUOUS"
            };

            var data = [continuous,
            {
            "sample": "sample_0",
            "attr_val": "I",
            "attr_id": "DISCRETE"
            }];

            var attributes = ["CONTINUOUS"];

            expect(OncoprintUtils.filter_by_attributes(data, attributes)).toEqual([continuous]);
        });

        it("filters by multiple attributes", function() {

            var continuous = {
                "sample": "sample_0",
            "attr_val": 5090,
            "attr_id": "CONTINUOUS"
            };

            var data = [continuous,
            {
                "sample": "sample_0",
            "attr_val": "I",
            "attr_id": "DISCRETE"
            }];

            var attributes = ["CONTINUOUS", "DISCRETE"];

            expect(OncoprintUtils.filter_by_attributes(data, attributes)).toEqual(data);
        });

        it("filters by both attributes and genes", function() {
            var GeneA = {
            "sample": "sample_0",
            "rppa": "UPREGULATED",
            "gene": "GeneA",
            "cna": "HEMIZYGOUSLYDELETED"
            };

            var continuous = {
            "sample": "sample_0",
            "attr_val": 5090,
            "attr_id": "CONTINUOUS"
            };

            var data = [GeneA, continuous,
            {
            "sample": "sample_0",
            "attr_val": "I",
            "attr_id": "DISCRETE"
            }];

            var attributes = [ "GeneA", "CONTINUOUS"];

            expect(OncoprintUtils.filter_by_attributes(data, attributes))
                .toEqual([GeneA, continuous]);
        });
    });

    describe("filter_altered", function() {

        it("when there is only one gene", function() {
                var raw_data = [
                {
                    "sample": "sample_0",
                    "rppa": "DOWNREGULATED",
                    "gene": "GeneA",
                    "mutation": "FOO MUTATION",
                    "cna": "GAINED"
                },
                {
                    "sample": "sample_1",
                    "rppa": "DOWNREGULATED",
                    "gene": "GeneA",
                    "mutation": "FOO MUTATION",
                    "cna": "GAINED"
                },
                {
                    "sample": "sample_2",
                    "gene": "GeneA"
                },
                {
                    "sample": "sample_3",
                    "gene": "GeneA"
                }
            ];

            var data = d3.nest()
                .key(function(d) { return d.sample; })
                .entries(raw_data);

            expect(OncoprintUtils.filter_altered(data))
                .toEqual(d3.set(["sample_0", "sample_1"]));
        });

        it("when there are multiple genes", function() {

            var raw_data = [
                {
                "sample": "sample_0",
                "rppa": "DOWNREGULATED",
                "gene": "GeneA",
                "mutation": "FOO MUTATION",
                "cna": "GAINED"
                },
                {
                "sample": "sample_0",
                "gene": "GeneB",
                "cna": "AMPLIFIED"
                },

                {
                "sample": "sample_1",
                "rppa": "DOWNREGULATED",
                "gene": "GeneA",
                "mutation": "FOO MUTATION",
                "cna": "GAINED"
                },
                {
                "sample": "sample_1",
                "gene": "GeneB",
                "cna": "AMPLIFIED"
                },
                {
                "sample": "sample_2",
                "gene": "GeneA",
                },
                {
                "sample": "sample_2",
                "gene": "GeneB",
                }
            ];

            var data = d3.nest()
                .key(function(d) { return d.sample; })
                .entries(raw_data);

            expect(OncoprintUtils.filter_altered(data))
                .toEqual(d3.set(["sample_0", "sample_1"]));
        });
    });

    describe("percent_altered", function() {
        it("calculates percent altered for multiple genes", function() {

            var raw_data = [
                {
                "sample": "sample_0",
                "rppa": "DOWNREGULATED",
                "gene": "GeneA",
                "mutation": "FOO MUTATION",
                "cna": "GAINED"
                },
                {
                "sample": "sample_0",
                "gene": "GeneB",
                },
                {
                "sample": "sample_1",
                "rppa": "DOWNREGULATED",
                "gene": "GeneA",
                "mutation": "FOO MUTATION",
                "cna": "GAINED"
                },
                {
                "sample": "sample_1",
                "gene": "GeneB",
                },
                {
                "sample": "sample_2",
                "gene": "GeneA",
                },
                {
                "sample": "sample_2",
                "gene": "GeneB",
                }
            ];

            expect(OncoprintUtils.percent_altered(raw_data))
                .toEqual({GeneA: 67, GeneB: 0});
        });
    });

    describe("normalize_nested_values", function() {
        it("normalizes for a single element of a nested array", function() {
            var raw_data = [
                {
                "sample": "sample_0",
                "rppa": "DOWNREGULATED",
                "gene": "GeneA",
                "mutation": "FOO MUTATION",
                "cna": "GAINED"
                },
                {
                "sample": "sample_0",
                "attr_id": "foo",
                "attr_val": "NA",
                }
            ];

            var nested_data = OncoprintUtils.nest_data(raw_data);
            var attributes = ["GeneA", "foo", "bar"];
            var normalized_values = OncoprintUtils.normalize_nested_values(nested_data[0], attributes);

            expect(normalized_values.map(OncoprintUtils.get_attr)).toEqual(attributes);
        });
    });

    describe("normalize_clinical_attributes", function() {
        it("normalizes clinical data in a nested list", function() {

            var raw_data = [
                {
                "sample": "sample_0",
                "rppa": "DOWNREGULATED",
                "gene": "GeneA",
                "mutation": "FOO MUTATION",
                "cna": "GAINED"
                },
                {
                "sample": "sample_0",
                "gene": "GeneB",
                },
                {
                "sample": "sample_1",
                "rppa": "DOWNREGULATED",
                "gene": "GeneA",
                "mutation": "FOO MUTATION",
                "cna": "GAINED"
                },
                {
                "sample": "sample_1",
                "gene": "GeneB",
                },
                {
                "sample": "sample_2",
                "gene": "GeneA",
                },
                {
                "sample": "sample_2",
                "gene": "GeneB",
                },
                {
                "sample": "sample0",
                "attr_id": "foo",
                "attr_val": "NA"
                },
                {"sample": "sample1",
                "attr_id": "foo",
                "attr_val": "NA"
                },
            ];

        var nested_data = OncoprintUtils.nest_data(raw_data);

        var attributes = ["GeneA", "GeneB", "foo", "bar"];
        var normalized = OncoprintUtils.normalize_clinical_attributes(nested_data, attributes);

        expect(_.uniq(normalized.map(function(i) { return i.values.length; })).length).toEqual(1);
        expect(_.uniq(normalized.map(function(i) { return i.values.length; }))[0]).toEqual(attributes.length);
        });
    });

    describe("gene_data_type2range", function(){
        var raw_gene_data =  [
        {
        "sample": "sample_0",
        "rppa": "UPREGULATED",
        "gene": "GeneA",
        "mutation": "FOO MUTATION",
        "cna": "DIPLOID"
        },
        {
        "sample": "sample_0",
        "rppa": "UPREGULATED",
        "gene": "GeneB",
        "cna": "AMPLIFIED"
        },
        {
        "sample": "sample_1",
        "gene": "GeneA",
        "cna": "AMPLIFIED"
        } ];

        var map = OncoprintUtils.gene_data_type2range(raw_gene_data);

        it("takes gene raw data and converts it to a map of datatype to range", function() {
            expect(map.cna).toEqual(["DIPLOID", "AMPLIFIED"]);
        });

        it("includes undefined in the range of possible values", function() {
            expect(map.rppa).toEqual(["UPREGULATED", undefined]);
            expect(map.mutation).toEqual(["FOO MUTATION", undefined]);
        });

        it("and leaves nonexistant datatypes with a range of undefined", function(){
            expect(map.mrna).toBe(undefined);
        });
    });
});

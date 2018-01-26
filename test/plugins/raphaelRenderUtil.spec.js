/**
 * @fileoverview Test for LineTypeSeriesBase.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var raphaelRenderUtil = require('../../src/js/plugins/raphaelRenderUtil');
var raphael = require('raphael');

describe('RaphaelLineTypeBase', function() {
    describe('renderText()', function() {
        it('result of decoding the HTML entity must be applied.', function() {
            var paper = raphael(document.createElement('div'), 100, 100);
            var pos = {left: 10, top: 10};
            var actual = raphaelRenderUtil.renderText(paper, pos, '&lt;TESTMESSAGE&gt;').attrs.text;
            expect(actual).toBe('<TESTMESSAGE>');
        });
    });
    describe('makeLinePath()', function() {
        it('from position, to position을 이용하여 line graph를 그리기 위한 line path를 생성합니다.', function() {
            var actual = raphaelRenderUtil.makeLinePath(
                    {
                        left: 10,
                        top: 10
                    }, {
                        left: 100,
                        top: 100
                    }
                ),
                expected = ['M', 10, 10, 'L', 100, 100];
            expect(actual).toEqual(expected);
        });

        it('from position, to position이 같으면 (line두께 % 2 / 2)를 뺀 path를 생성합니다.', function() {
            var actual = raphaelRenderUtil.makeLinePath(
                    {
                        left: 10,
                        top: 10
                    }, {
                        left: 10,
                        top: 10
                    }
                ),
                expected = ['M', 9.5, 9.5, 'L', 9.5, 9.5];
            expect(actual).toEqual(expected);
        });
    });

    describe('getEllipsisText()', function() {
        it('should be a string value less than the set width.', function() {
            var paper = raphael(document.body, 100, 100);
            var newString = raphaelRenderUtil.getEllipsisText('get elipsis text test', 50, {
                fontSize: 11,
                fontFamily: 'Verdana',
                color: '#000000'
            });
            var textElement = paper.text(0, 0, newString).attr({fontFamily: 'Verdana', color: '#000000'});

            expect(textElement.getBBox().width).toBeLessThan(50);

            textElement.remove();
            paper.remove();
        });
    });
});

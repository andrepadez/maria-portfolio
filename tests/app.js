
describe('Application', function(){
	before(function(done){
		require(['app', 'test'], done);
	});

	after(require.unregister);

	it('Application should initiate without errors', function(){
		assert.doesNotThrow(app.init);
	});

    it('test module should be required correctly', function(){
        assert.equal(test, 'TESTE');
    });
});
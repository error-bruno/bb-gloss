var async = require('async');
var _ = require('lodash');
var models = require(process.cwd() + '/models');

module.exports = function(app) {
  return {
    index: function(req, res) {
      models.Locale.find({}, 'locale project', function(error, documents) {
        var options = {
          path: 'project',
          select: 'name'
        };
        models.Locale.populate(documents, options, function(error, documents) {
          return res.send(documents);
        });
      });
    },

    show: function(req, res) {
      // check for locale id
      if (!req.params.localeId) {
        return res.send(500, 'no locale id');
      }
      // get locale
      models.Locale.findById(req.params.localeId, 'locale translations', function(error, document) {
        if (error) {
          return res.send(500, error);
        }
        return res.send(document);
      });
    },

    create: function(req, res) {
      var document = {
        project: req.body.project,
        locale: req.body.locale,
        translations: req.body.translations
      };
      // check for required fields
      if (!document.locale || !document.project) {
        return res.send(400, 'missing data');
      }
      // check for default translations for this locale
      async.waterfall([
        // get default translations for this locale
        function(nextStep) {
          models.Project.findOne({ name: 'default' }, function(error, project) {
            models.Locale.findOne({project:project._id}, function(error, locale) {
              return nextStep(null, locale);
            });
          });
        },
        // merge with any translations passed
        function(locale, nextStep) {
          var defaultTranslations = _.cloneDeep(locale.translations);
          var translations = _.merge(defaultTranslations, translations);
          return nextStep(null, translations);
        }
      ], function(error, translations) {
        if (translations) {
          document.translations = translations;
        }
        // create locale
        models.Locale.create(document, function(error, document) {
          if (error) {
            return res.send(500, error);
          }
          return res.send(201, document);
        });
      });

    },

    update: function(req, res) {
      var document = req.body;
      var conditions = {
        _id: req.params.projectId
      };
      // check for project id
      if (!conditions._id) {
        return res.send(400, 'no project id');
      }
      // update
      models.Project.update(conditions, document, function(error) {
        if (error) {
          return res.send(500, error);
        }
        return res.send(200);
      });
    },

    remove: function(req, res) {
      // check for project id
      if (!req.params.projectId) {
        return res.send(400, 'no project id');
      }
      // remove
      models.Project.findByIdAndRemove(req.params.projectId, function(error) {
        if (error) {
          return res.send(500, error);
        }
        return res.send(204);
      });
    }

  };
};

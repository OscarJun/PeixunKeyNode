
var routeSql = {},
AbpPermissions = require('./allSql/AbpPermissions.js'),
AbpRoles = require('./allSql/AbpRoles.js'),
AbpTenants = require('./allSql/AbpTenants.js'),
AbpUserRoles = require('./allSql/AbpUserRoles.js'),
AbpUsers = require('./allSql/AbpUsers.js'),
AppVersions = require('./allSql/AppVersions.js'),
CourseExpands = require('./allSql/CourseExpands.js'),
CourseLabels = require('./allSql/CourseLabels.js'),
Evaluations = require('./allSql/Evaluations.js'),
Labels = require('./allSql/Labels.js'),
PhoneValidates = require('./allSql/PhoneValidates.js'),
TCourseRecords = require('./allSql/TCourseRecords.js'),
TrainCourseAnalysis = require('./allSql/TrainCourseAnalysis.js'),
TrainCourseCategories = require('./allSql/TrainCourseCategories.js'),
TrainCourses = require('./allSql/TrainCourses.js'),
TrainCourseSections = require('./allSql/TrainCourseSections.js'),
TrainPeriodRecords = require('./allSql/TrainPeriodRecords.js'),
TrainPeriods = require('./allSql/TrainPeriods.js'),
UserExpands = require('./allSql/UserExpands.js')
MyExamBase = require('./allSql/MyExamBase.js')
MyExam = require('./allSql/MyExam.js')
MyExamQuestion = require('./allSql/MyExamQuestion.js')
MyQuestions = require('./allSql/MyQuestions.js')
MyQuestionOption = require('./allSql/MyQuestionOption.js')
ExamResult = require('./allSql/ExamResult.js')
ExamResultRecord = require('./allSql/ExamResultRecord.js')
Classes = require('./allSql/Classes.js')
HomeWork = require('./allSql/HomeWork.js')
HomeWorkResult = require('./allSql/HomeWorkResult.js')
HomeWorkImage = require('./allSql/HomeWorkImage.js')
// HomeWorkResultImage = require('./allSql/HomeWorkResultImage.js')
Questionnaires = require('./allSql/Questionnaires.js')
QuestionSurveies = require('./allSql/QuestionSurveies.js')
QuestionnaireResults = require('./allSql/QuestionnaireResults.js')
ClassAndCourses = require('./allSql/ClassAndCourses.js')
Resources = require('./allSql/Resources.js')
Praises = require('./allSql/Praises.js')
Collects = require('./allSql/Collects.js')
WebCarouselFigure = require('./allSql/WebCarouselFigure.js')
CarouselFigure = require('./allSql/CarouselFigure.js')
RecommendCourse = require('./allSql/RecommendCourse.js')
HomeWorkAnswer = require('./allSql/HomeWorkAnswer.js')
TeachingActivity = require('./allSql/TeachingActivity.js')
TeachingLink = require('./allSql/TeachingLink.js')
TeachingTask = require('./allSql/TeachingTask.js')
TeachingDetail = require('./allSql/TeachingDetail.js')
TeachingTeam = require('./allSql/TeachingTeam.js')
TeachingTeamUser = require('./allSql/TeachingTeamUser.js')
TeachingActivityUser = require('./allSql/TeachingActivityUser.js')
CloudDisks = require('./allSql/CloudDisks.js')
CloudDiskFiles = require('./allSql/CloudDiskFiles.js')
ClassesName = require('./allSql/ClassesName.js')
QuesBank = require('./allSql/QuesBank.js')
Notification = require('./allSql/Notification.js')
SameScreenRoom = require('./allSql/SameScreenRoom.js')
MyQueClassify = require('./allSql/MyQueClassify.js')


// Ques.belongsTo(User,{foreignKey:'userId',targetKey:'Id'});
// User.hasOne(Ans,{foreignKey:'userId',targetKey:'Id'});
AbpPermissions.belongsTo(AbpRoles,{foreignKey:'RoleId',targetKey:'Id',as:'1'});
AbpPermissions.belongsTo(AbpUsers,{foreignKey:'UserId',targetKey:'Id',as:'2'});
// AbpRoles.belongsTo(AbpTenants,{foreignKey:'TenantId',targetKey:'Id'});
AbpRoles.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:'3'});
AbpRoles.belongsTo(AbpUsers,{foreignKey:'DeleterUserId',targetKey:'Id',as:'4'});
AbpRoles.belongsTo(AbpUsers,{foreignKey:'LastModifierUserId',targetKey:'Id',as:'5'});
// AbpTenants.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id'});
// AbpTenants.belongsTo(AbpUsers,{foreignKey:'DeleterUserId',targetKey:'Id'});
// AbpTenants.belongsTo(AbpUsers,{foreignKey:'LastModifierUserId',targetKey:'Id'});
// AbpUsers.belongsTo(AbpTenants,{foreignKey:'TenantId',targetKey:'Id'});
AbpUserRoles.belongsTo(AbpUsers,{foreignKey:'UserId',targetKey:'Id',as:'6'});
AbpUsers.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:'7'});
AbpUsers.belongsTo(AbpUsers,{foreignKey:'LastModifierUserId',targetKey:'Id',as:'8'});
AbpUsers.belongsTo(AbpUsers,{foreignKey:'DeleterUserId',targetKey:'Id',as:'9'});
AbpUsers.belongsTo(UserExpands,{foreignKey:'UserExpandId',targetKey:'Id',as:'10'});
Evaluations.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:'11'});

TCourseRecords.belongsTo(AbpUsers,{foreignKey:'UserId',targetKey:'Id',as:'12'});
CourseLabels.belongsTo(Labels,{foreignKey:'LabelId',targetKey:'Id',as:'CourseLabelsLabelId'});
// TrainCourseCategories.belongsTo(TrainCourseCategories,{foreignKey:'FatherId',targetKey:'Id',as:'TrainCourseCategoriesFatherId'})
TrainCourses.hasMany(CourseExpands,{foreignKey:'CourseId',targetKey:'Id',as:'TrainCoursesCourseExpands'})
CourseLabels.belongsTo(TrainCourses,{foreignKey:'TrainCourseId',targetKey:'Id',as:'CourseLabelsTrainCourseId'});
TrainCourses.hasMany(TCourseRecords,{foreignKey:'TrainCourseId',targetKey:'Id',as:'15'});
TrainCourses.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:'TrainCoursesCreatorUserId'});
TrainCourses.belongsTo(AbpUsers,{foreignKey:'DeleterUserId',targetKey:'Id',as:'17'});
TrainCourses.belongsTo(AbpUsers,{foreignKey:'LastModifierUserId',targetKey:'Id',as:'TrainCoursesLastModifierUserId'});
TrainCourses.belongsTo(TrainCourseAnalysis,{foreignKey:'TrainCourseAnalysisId',targetKey:'Id',as:'TrainCoursesTrainCourseAnalysisId'});
TrainCourses.belongsTo(TrainCourseCategories,{foreignKey:'TrainCourseCategoryId',targetKey:'Id',as:'CategoryName'});
TrainCourseSections.hasOne(TrainPeriods,{foreignKey:'CourseSectionId',targetKey:'Id',as:'TrainCourseSectionsTrainPeriods'});
// TrainPeriods.belongsTo(ResourceId)
TrainPeriods.hasOne(TrainPeriodRecords,{foreignKey:'PeriodId',targetKey:'Id',as:'TrainPeriodRecordsTrainPeriods'});
MyExamQuestion.belongsTo(MyExamBase,{foreignKey:'MyExamBaseId',targetKey:'Id',as:''})
MyExamQuestion.belongsTo(MyQuestions,{foreignKey:'QuestionId',targetKey:'Id',as:'ExamQuestionofMyQuestions'})
MyQuestions.hasOne(MyExamQuestion,{foreignKey:'QuestionId',targetKey:'Id',as:'ExamQuestionofMyQuestions'})
MyExam.belongsTo(MyExamBase,{foreignKey:'MyExamBaseId',targetKey:'Id',as:'TestPaper'})
MyQuestions.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:''})
MyQuestions.belongsTo(AbpUsers,{foreignKey:'DeleterUserId',targetKey:'Id',as:''})
MyQuestions.belongsTo(AbpUsers,{foreignKey:'LastModifierUserId',targetKey:'Id',as:''})
MyQuestionOption.belongsTo(MyQuestions,{foreignKey:'QuestionId',targetKey:'Id',as:'QuestionOptiontoMyQuestions'})
MyQuestions.hasMany(MyQuestionOption,{foreignKey:'QuestionId',targetKey:'Id',as:'QuestionOptiontoMyQuestions'})
ExamResult.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:''})
ExamResult.belongsTo(AbpUsers,{foreignKey:'DeleterUserId',targetKey:'Id',as:''})
ExamResult.belongsTo(AbpUsers,{foreignKey:'LastModifierUserId',targetKey:'Id',as:''})
ExamResult.belongsTo(AbpUsers,{foreignKey:'UserId',targetKey:'Id',as:'ExamResultUsers'})
ExamResult.belongsTo(MyExam,{foreignKey:'ExamId',targetKey:'Id',as:''})
ExamResultRecord.belongsTo(ExamResult,{foreignKey:'ExamResultId',targetKey:'Id',as:''})
// ExamResultRecord.belongsTo(MyQuestionOption,{foreignKey:'QuestionOptionId',targetKey:'Id',as:''})
Classes.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:''})
Classes.belongsTo(AbpUsers,{foreignKey:'DeleterUserId',targetKey:'Id',as:''})
Classes.belongsTo(AbpUsers,{foreignKey:'LastModifierUserId',targetKey:'Id',as:''})
MyExam.belongsTo(Classes,{foreignKey:'ClassesId',targetKey:'Id',as:''})
HomeWork.belongsTo(HomeWorkAnswer,{foreignKey:'AnswerId',targetKey:'Id',as:'HomeWorkAnswer'})
// HomeWork.belongsTo(Classes,{foreignKey:'ClassesId',targetKey:'Id',as:''})
HomeWork.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:''})
HomeWorkResult.belongsTo(AbpUsers,{foreignKey:'UserId',targetKey:'Id',as:'HomeWorkResultAbpUser'})
AbpUsers.hasMany(HomeWorkResult,{foreignKey:'UserId',targetKey:'Id',as:'HomeWorkResultAbpUser'})

HomeWorkResult.belongsTo(HomeWork,{foreignKey:'HomeWorkId',targetKey:'Id',as:''})
Questionnaires.belongsTo(Classes,{foreignKey:'ClassesId',targetKey:'Id',as:''})
Questionnaires.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:''})
QuestionSurveies.belongsTo(Questionnaires,{foreignKey:'QuestionnaireId',targetKey:'Id',as:''})
QuestionnaireResults.belongsTo(QuestionSurveies,{foreignKey:'QuestionSurveiesId',targetKey:'Id',as:''})
// HomeWorkImage.belongsTo(HomeWork,{foreignKey:'WorkId',targetKey:'Id',as:''})
HomeWorkImage.belongsTo(Resources,{foreignKey:'ResourceId',targetKey:'Id',as:'HomeWorkResource'})
// HomeWorkResultImage.belongsTo(HomeWorkResult,{foreignKey:'WorkResultId',targetKey:'Id',as:''})
ClassAndCourses.belongsTo(Classes,{foreignKey:'ClassId',targetKey:'Id',as:''})
ClassAndCourses.belongsTo(TrainCourses,{foreignKey:'TrainCourseId',targetKey:'Id',as:''})
TrainPeriods.belongsTo(Resources,{foreignKey:'ResourceId',targetKey:'Id',as:'TrainPeriodResource'})
RecommendCourse.belongsTo(TrainCourses,{foreignKey:'CourseId',targetKey:'Id',as:'RecommendCourseId'})
TeachingLink.belongsTo(TeachingActivity,{foreignKey:'TeachingActivityId',targetKey:'Id',as:'TeachingLinkActivityId'})
TeachingActivity.hasMany(TeachingLink,{foreignKey:'TeachingActivityId',targetKey:'Id',as:'TeachingLinkActivityId'})
TeachingActivity.belongsTo(AbpUsers,{foreignKey:'CreatorUserId',targetKey:'Id',as:'ActivityCreatorUser'})
TeachingTask.belongsTo(TeachingLink,{foreignKey:'TeachingLinkId',targetKey:'Id',as:'TeachingTaskLinkId'})
TeachingLink.hasMany(TeachingTask,{foreignKey:'TeachingLinkId',targetKey:'Id',as:'TeachingTaskLinkId'})
TeachingDetail.belongsTo(TeachingTask,{foreignKey:'TeachingTaskId',targetKey:'Id',as:'TeachingDetailTaskId'})
TeachingTask.hasMany(TeachingDetail,{foreignKey:'TeachingTaskId',targetKey:'Id',as:'TeachingDetailTaskId'})
TeachingTeamUser.belongsTo(TeachingTeam,{foreignKey:'TeachingTeamId',targetKey:'Id',as:''})

TeachingActivityUser.belongsTo(TeachingActivity,{foreignKey:'TeachingActivityId',targetKey:'Id',as:'UserTeachingActivityId'})
TeachingActivity.hasMany(TeachingActivityUser,{foreignKey:'TeachingActivityId',targetKey:'Id',as:'UserTeachingActivityId'})
CloudDiskFiles.belongsTo(CloudDisks,{foreignKey:'CloudDiskId',targetKey:'Id',as:''})
CloudDiskFiles.belongsTo(Resources,{foreignKey:'ResourceId',targetKey:'Id',as:'DiskFilesResourceId'})
QuesBank.belongsTo(MyQuestions,{foreignKey:'QuestionId',targetKey:'Id',as:'QuesBankQuestions'})
MyQuestions.hasMany(QuesBank,{foreignKey:'QuestionId',targetKey:'Id',as:'QuesBankQuestions'})
AbpUsers.hasMany(Notification,{foreignKey:'UserId',targetKey:'Id',as:''})
Notification.belongsTo(AbpUsers,{foreignKey:'UserId',targetKey:'Id',as:''})


UserExpands.sync({force:false});
AbpUsers.sync({force:false});
Resources.sync({force:false});
// AbpTenants.sync({force:false});
AbpRoles.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)});//???ݱ???崴????ݿ????????ڱ????????
Classes.sync({force:false});
AbpPermissions.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)});//???ݱ???崴????ݿ????????ڱ????????
AbpUserRoles.sync({force:false});
AppVersions.sync({force:false});
CourseExpands.sync({force:false});
Labels.sync({force:false});
TrainCourseAnalysis.sync({force:false});
TrainCourseCategories.sync({force:false});
TrainCourses.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)});//???ݱ???崴????ݿ????????ڱ????????
CourseLabels.sync({force:false});
Evaluations.sync({force:false});
PhoneValidates.sync({force:false});
TCourseRecords.sync({force:false});
TrainCourseSections.sync({force:false});
TrainPeriods.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)});
TrainPeriodRecords.sync({force:false});
MyExamBase.sync({force:false});
MyQuestions.sync({force:false})
MyExam.sync({force:false});
MyExamQuestion.sync({force:false})
MyQuestionOption.sync({force:false})
ExamResult.sync({force:false})
ExamResultRecord.sync({force:false})
HomeWorkAnswer.sync({force:false})
HomeWork.sync({force:false})
HomeWorkResult.sync({force:false})
Questionnaires.sync({force:false})
QuestionSurveies.sync({force:false})
QuestionnaireResults.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)})
HomeWorkImage.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)})
// TrainPeriods
// HomeWorkResultImage.sync({force:false})
ClassAndCourses.sync({force:false})
Praises.sync({force:false})
Collects.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)})
WebCarouselFigure.sync({force:false})
CarouselFigure.sync({force:false})
RecommendCourse.sync({force:false})
TeachingActivity.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)})
TeachingLink.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)})
TeachingTask.sync({force:false})
TeachingDetail.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)})
TeachingTeam.sync({force:false})
TeachingTeamUser.sync({force:false})
TeachingActivityUser.sync({force:false})
CloudDisks.sync({force:false})
CloudDiskFiles.sync({force:false})
ClassesName.sync({force:false})
QuesBank.sync({force:false})
Notification.sync({force:false})//.then(function(e){console.log(e)}).catch(function(err){console.log(err)})
SameScreenRoom.sync({force:false})
MyQueClassify.sync({force:false})


routeSql.AbpPermissions = AbpPermissions;
routeSql.AbpRoles = AbpRoles;
routeSql.AbpTenants = AbpTenants;
routeSql.AbpUserRoles = AbpUserRoles;
routeSql.AbpUsers = AbpUsers;
routeSql.AppVersions = AppVersions;
routeSql.CourseExpands = CourseExpands;
routeSql.CourseLabels = CourseLabels;
routeSql.Evaluations = Evaluations;
routeSql.Labels = Labels;
routeSql.PhoneValidates = PhoneValidates;
routeSql.TCourseRecords = TCourseRecords;
routeSql.TrainCourseAnalysis = TrainCourseAnalysis;
routeSql.TrainCourseCategories = TrainCourseCategories;
routeSql.TrainCourses = TrainCourses;
routeSql.TrainCourseSections = TrainCourseSections;
routeSql.TrainPeriodRecords = TrainPeriodRecords;
routeSql.TrainPeriods = TrainPeriods;
routeSql.UserExpands = UserExpands;
routeSql.Classes = Classes;
routeSql.MyExamBase = MyExamBase;
routeSql.MyExam = MyExam;
routeSql.MyExamQuestion = MyExamQuestion;
routeSql.MyQuestions = MyQuestions;
routeSql.MyQuestionOption = MyQuestionOption;
routeSql.ExamResult = ExamResult;
routeSql.ExamResultRecord = ExamResultRecord;
routeSql.HomeWork = HomeWork;
routeSql.HomeWorkResult = HomeWorkResult;
routeSql.HomeWorkImage = HomeWorkImage;
// routeSql.HomeWorkResultImage = HomeWorkResultImage;
routeSql.Questionnaires = Questionnaires;
routeSql.QuestionSurveies = QuestionSurveies;
routeSql.QuestionnaireResults = QuestionnaireResults;
routeSql.ClassAndCourses = ClassAndCourses;
routeSql.Resources = Resources;
routeSql.Praises = Praises;
routeSql.Collects = Collects;
routeSql.WebCarouselFigure = WebCarouselFigure;
routeSql.CarouselFigure = CarouselFigure;
routeSql.RecommendCourse = RecommendCourse;
routeSql.HomeWorkAnswer = HomeWorkAnswer;
routeSql.TeachingActivity = TeachingActivity;
routeSql.TeachingLink = TeachingLink;
routeSql.TeachingTask = TeachingTask;
routeSql.TeachingDetail = TeachingDetail;
routeSql.TeachingTeam = TeachingTeam;
routeSql.TeachingTeamUser = TeachingTeamUser;
routeSql.TeachingActivityUser = TeachingActivityUser;
routeSql.CloudDisks = CloudDisks;
routeSql.CloudDiskFiles = CloudDiskFiles;
routeSql.ClassesName = ClassesName;
routeSql.QuesBank = QuesBank;
routeSql.Notification = Notification;
routeSql.SameScreenRoom = SameScreenRoom;
routeSql.MyQueClassify = MyQueClassify;


module.exports = routeSql;


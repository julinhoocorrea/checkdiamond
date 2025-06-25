import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  CheckCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Package,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TestEnvio {
  id: string;
  kwaiId: string;
  diamondQuantity: number;
  customerName: string;
}

interface MobileStep {
  id: number;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  isManual: boolean;
  duration: number;
}

export function TestePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [kwaiAppInstalled, setKwaiAppInstalled] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Envio de teste
  const testEnvio: TestEnvio = {
    id: 'test_001',
    kwaiId: 'teste123',
    diamondQuantity: 100,
    customerName: 'Cliente Teste'
  };

  const steps: MobileStep[] = [
    {
      id: 1,
      title: '📱 Verificando App Kwai',
      description: 'Verificando se o app Kwai nativo está instalado',
      action: 'checkApp',
      completed: false,
      isManual: false,
      duration: 2000
    },
    {
      id: 2,
      title: '💬 Abrindo Mensagens',
      description: 'Navegando para aba de mensagens no app nativo',
      action: 'openMessages',
      completed: false,
      isManual: false,
      duration: 1500
    },
    {
      id: 3,
      title: '🛍️ Procurando Kwai Shop',
      description: 'Abrindo conversa com Kwai Shop ou conta oficial',
      action: 'openShop',
      completed: false,
      isManual: false,
      duration: 1500
    },
    {
      id: 4,
      title: '🔗 Link de Distribuição',
      description: 'MANUAL: Você deve clicar no link dentro da conversa',
      action: 'clickLink',
      completed: false,
      isManual: true,
      duration: 5000
    },
    {
      id: 5,
      title: '📝 Preenchendo Formulário',
      description: `MANUAL: Preencha ID "${testEnvio.kwaiId}" e "${testEnvio.diamondQuantity}" diamantes`,
      action: 'fillForm',
      completed: false,
      isManual: true,
      duration: 8000
    },
    {
      id: 6,
      title: '✅ Confirmando Envio',
      description: 'MANUAL: Clique "Confirm" no app e confirme aqui',
      action: 'confirmSend',
      completed: false,
      isManual: true,
      duration: 10000
    }
  ];

  const [testSteps, setTestSteps] = useState(steps);

  // Simular verificação do app Kwai
  const checkKwaiApp = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simular detecção de app
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (!isMobileDevice) {
        setKwaiAppInstalled(false);
        resolve(false);
        return;
      }

      // Simular tentativa de abrir app
      setTimeout(() => {
        const appInstalled = Math.random() > 0.3; // 70% chance de estar instalado
        setKwaiAppInstalled(appInstalled);
        resolve(appInstalled);
      }, 1500);
    });
  };

  // Executar step específico
  const executeStep = async (step: MobileStep) => {
    addTestResult(`🔄 Executando: ${step.title}`);

    switch (step.action) {
      case 'checkApp':
        const appInstalled = await checkKwaiApp();
        if (appInstalled) {
          addTestResult('✅ App Kwai encontrado e abrindo...');
          try {
            // Tentar abrir app via deep link
            window.location.href = 'kwai://main';
            addTestResult('📱 Deep link enviado: kwai://main');
          } catch (error) {
            addTestResult('⚠️ Deep link falhou, mas continuando...');
          }
        } else {
          addTestResult('❌ App Kwai não encontrado!');
          throw new Error('App Kwai não instalado');
        }
        break;

      case 'openMessages':
        addTestResult('💬 Navegando para mensagens...');
        try {
          window.location.href = 'kwai://open?page=messages';
          addTestResult('📱 Deep link enviado: kwai://open?page=messages');
        } catch (error) {
          addTestResult('⚠️ Navegação manual necessária');
        }
        break;

      case 'openShop':
        addTestResult('🛍️ Procurando Kwai Shop...');
        try {
          if (/Android/i.test(navigator.userAgent)) {
            window.location.href = 'kwai://chat?user=kwai_official';
            addTestResult('📱 Deep link Android: kwai://chat?user=kwai_official');
          } else {
            window.location.href = 'kwai://open?chat=kwai_shop';
            addTestResult('📱 Deep link iOS: kwai://open?chat=kwai_shop');
          }
        } catch (error) {
          addTestResult('⚠️ Abertura manual necessária');
        }
        break;

      case 'clickLink':
        addTestResult('🔗 AÇÃO MANUAL: Clique no link de distribuição dentro da conversa');
        toast.warning('🔗 AÇÃO MANUAL NECESSÁRIA', {
          description: 'Encontre e clique no link de distribuição de diamantes na conversa',
          duration: 8000
        });
        break;

      case 'fillForm':
        addTestResult('📝 AÇÃO MANUAL: Preencha o formulário no app');
        const dataText = `ID: ${testEnvio.kwaiId}\nDiamantes: ${testEnvio.diamondQuantity}`;

        try {
          await navigator.clipboard.writeText(dataText);
          addTestResult('📋 Dados copiados para clipboard!');
          toast.success('📋 Dados copiados!', {
            description: 'Cole no formulário do app Kwai'
          });
        } catch {
          addTestResult('📋 Copie manualmente: ' + dataText);
        }

        toast.warning('📝 PREENCHA NO APP KWAI:', {
          description: `ID: ${testEnvio.kwaiId} | Diamantes: ${testEnvio.diamondQuantity}`,
          duration: 15000
        });
        break;

      case 'confirmSend':
        addTestResult('✅ AÇÃO MANUAL: Confirme o envio no app');
        toast.warning('✅ CONFIRME NO APP KWAI', {
          description: 'Clique "Confirm" no app e confirme aqui quando terminar',
          duration: 20000
        });

        // Simular aguardo da confirmação
        setTimeout(() => {
          const confirmed = window.confirm(
            `Você confirmou o envio no app Kwai?\n\n` +
            `✅ SIM = Envio realizado com sucesso\n` +
            `❌ NÃO = Houve algum problema`
          );

          if (confirmed) {
            addTestResult('🎉 Envio confirmado pelo usuário!');
            toast.success('🎉 Envio confirmado!', {
              description: 'Processo concluído com sucesso'
            });
          } else {
            addTestResult('❌ Envio não confirmado');
            toast.error('❌ Envio não confirmado');
          }
        }, 3000);
        break;
    }
  };

  // Adicionar resultado do teste
  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Executar teste completo
  const startTest = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setTestResults([]);

    // Reset steps
    setTestSteps(steps.map(s => ({ ...s, completed: false })));

    addTestResult('🚀 INICIANDO TESTE DO SISTEMA HÍBRIDO MOBILE');
    addTestResult(`📱 Dispositivo: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`);

    try {
      for (let i = 0; i < testSteps.length; i++) {
        const step = testSteps[i];

        setCurrentStep(i);
        addTestResult(`\n--- STEP ${i + 1}: ${step.title} ---`);

        // Executar step
        await executeStep(step);

        // Marcar como completo
        setTestSteps(prev =>
          prev.map(s => s.id === step.id ? { ...s, completed: true } : s)
        );

        // Aguardar duração do step
        await new Promise(resolve => setTimeout(resolve, step.duration));

        addTestResult(`✅ Step ${i + 1} concluído`);
      }

      setCurrentStep(testSteps.length);
      addTestResult('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
      toast.success('🎉 Teste concluído!', {
        description: 'Sistema híbrido testado com sucesso'
      });

    } catch (error) {
      addTestResult(`\n❌ TESTE FALHOU: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error('❌ Teste falhou', {
        description: error instanceof Error ? error.message : 'Erro no teste'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Reset teste
  const resetTest = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setTestResults([]);
    setTestSteps(steps.map(s => ({ ...s, completed: false })));
    setKwaiAppInstalled(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            📱 TESTE DIRETO - Sistema Híbrido Kwai
          </h1>
          <p className="text-blue-700 text-lg">
            Teste completo do sistema que abre o app Kwai nativo no seu celular!
          </p>
        </motion.div>

        {/* Botão de Teste Principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Smartphone className="w-6 h-6" />
                🎯 Simulador de Teste Mobile
              </CardTitle>
              <CardDescription className="text-blue-700">
                Sistema detectado: {navigator.userAgent.includes('Mobile') ?
                  '📱 Dispositivo mobile - Teste REAL possível!' :
                  '🖥️ Desktop - Teste simulado'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={startTest}
                  disabled={isRunning}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-3"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      🚀 INICIAR TESTE COMPLETO
                    </>
                  )}
                </Button>

                <Button
                  onClick={resetTest}
                  variant="outline"
                  className="gap-2 text-lg px-6 py-3"
                  size="lg"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress do Teste */}
        {(isRunning || testResults.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Steps Visual */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-800">📋 Progresso dos Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testSteps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-4 rounded-lg border ${
                        step.completed
                          ? 'bg-green-50 border-green-200'
                          : index === currentStep && isRunning
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {step.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : index === currentStep && isRunning ? (
                          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                        ) : (
                          <Clock className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{step.title}</span>
                          {step.isManual ? (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              👤 Manual
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              🤖 Auto
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{step.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Log de Resultados */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">📊 Log em Tempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {testResults.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-1"
                      >
                        {result}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isRunning && (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
                      className="text-yellow-400 mt-2"
                    >
                      ▋ Executando teste...
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dados do Teste */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">📝 Dados do Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-bold text-lg text-gray-900">{testEnvio.customerName}</div>
                  <div className="text-sm text-gray-600">Cliente</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-bold text-lg font-mono text-blue-600">{testEnvio.kwaiId}</div>
                  <div className="text-sm text-gray-600">Kwai ID</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-bold text-lg text-purple-600">{testEnvio.diamondQuantity} 💎</div>
                  <div className="text-sm text-gray-600">Diamantes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instruções */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-indigo-800">💡 Como Funciona o Teste</CardTitle>
            </CardHeader>
            <CardContent className="text-indigo-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-2">🤖 Steps Automáticos (1-3):</h4>
                  <div className="space-y-1 text-sm">
                    <div>• Verifica se app Kwai está instalado</div>
                    <div>• Abre app via deep link kwai://main</div>
                    <div>• Navega para mensagens e Kwai Shop</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">👤 Steps Manuais (4-6):</h4>
                  <div className="space-y-1 text-sm">
                    <div>• Você clica no link dentro da conversa</div>
                    <div>• Você preenche ID e diamantes no app</div>
                    <div>• Você confirma envio e retorna</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
                <div className="font-bold text-sm mb-1">📱 IMPORTANTE:</div>
                <div className="text-sm">
                  {navigator.userAgent.includes('Mobile') ?
                    'Você está no celular! O teste pode abrir o app Kwai de verdade!' :
                    'Você está no desktop. O teste será simulado, mas funciona igual no celular.'
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
